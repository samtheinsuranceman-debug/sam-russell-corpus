import { motion } from "framer-motion";
import { useState } from "react";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { PrefetchLink } from "@/components/PrefetchLink";
import { Button } from "@/components/ui/button";
import { Shield, Brain, Users, Zap, TrendingUp, AlertTriangle, Mic, FileCheck, ArrowRight } from "lucide-react";

// Founder portrait. Drop a photo at client/public/founder-sam-russell.jpg and it
// appears automatically; until then, a tasteful monogram stands in.
function FounderPhoto() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative w-full aspect-[4/5] max-w-[340px] mx-auto rounded-2xl overflow-hidden border border-primary/15 bg-gradient-to-b from-primary/[0.06] to-transparent">
      {!failed ? (
        <img
          src="/founder-sam-russell.jpg"
          alt="Samuel A. Russell V"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <div
            className="w-24 h-24 rounded-full border border-primary/40 flex items-center justify-center text-3xl text-primary"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            SR
          </div>
          <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Samuel A. Russell V
          </span>
        </div>
      )}
    </div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px]" />
          <div className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-[80px]" />
        </div>

        <div className="container relative z-10 max-w-4xl mx-auto text-center">
          <motion.p
            className="text-xs uppercase tracking-[0.25em] text-accent/60 mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            About AQAL Intelligence
          </motion.p>
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl text-foreground mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em", fontWeight: 300 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            Know your mind. Protect it. Maximize it.
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            AQAL Intelligence maps 32 independent dimensions of your cognitive architecture,
            identifies where you're exceptional, where you're vulnerable, and connects you
            with the people whose strengths shield your blind spots.
          </motion.p>
        </div>
      </section>

      {/* Two-Stage Assessment */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent" />
        <div className="container relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] text-primary/60 mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Two-Stage Measurement
            </p>
            <h2
              className="text-3xl sm:text-4xl text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              From signal to certainty
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Your intelligence architecture is measured in two distinct stages — each with a different
              confidence level, each revealing different layers of who you are.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stage 1 */}
            <motion.div
              className="glass-card p-8 rounded-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/60 to-accent/20" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/[0.1] border border-accent/20 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-accent/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Stage One
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">Voice-Based Assessment</h3>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  You answer open-ended questions by speaking naturally. Five independent AI systems analyze
                  your language — word choice, structural complexity, micro-hesitations, tonal patterns,
                  and conceptual depth — to produce an initial map of your 32 intelligence lines.
                </p>
                <div className="p-4 rounded-xl bg-accent/[0.05] border border-accent/10">
                  <p className="text-sm text-accent font-medium mb-1">Confidence Level: Preliminary</p>
                  <p className="text-xs text-muted-foreground">
                    Voice analysis captures real cognitive signal but cannot verify claims or measure
                    demonstrated capability. Think of this as a high-resolution hypothesis — directionally
                    accurate, awaiting confirmation.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>30-60 minutes of natural conversation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Five-AI consensus scoring (no single model decides)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Immediate preliminary results upon completion</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Stage 2 */}
            <motion.div
              className="glass-card p-8 rounded-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/30" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/[0.1] border border-primary/20 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Stage Two
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">Evidence-Based Verification</h3>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  You upload real evidence — certifications, portfolios, publications, performance records,
                  creative works, leadership documentation — and our system infers and measures intelligence
                  lines from demonstrated, verifiable accomplishments.
                </p>
                <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/10">
                  <p className="text-sm text-primary font-medium mb-1">Confidence Level: High</p>
                  <p className="text-xs text-muted-foreground">
                    Evidence-based scoring draws from facts you can prove. This produces a score
                    with substantially higher confidence — grounded in demonstrated capability rather
                    than linguistic inference alone.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Upload resumes, certifications, portfolios, creative works</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Each piece of evidence strengthens specific intelligence lines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Verification tiers: Foundational → Verified → Comprehensive → Elite</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-muted-foreground/70 italic max-w-2xl mx-auto">
              Together, the two stages produce a complete intelligence architecture — one that reflects
              both how your mind works (voice) and what your mind has accomplished (evidence).
            </p>
          </motion.div>
        </div>
      </section>

      {/* Strength Cluster Maximization */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p
                  className="text-xs uppercase tracking-[0.25em] text-primary/60 mb-4"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Strength Clusters
                </p>
                <h2
                  className="text-3xl sm:text-4xl text-foreground mb-6"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                >
                  Maximize what makes you exceptional
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Your highest-scoring intelligence lines don't operate in isolation. They form
                    <strong className="text-foreground"> strength clusters</strong> — groups of
                    capabilities that amplify each other when used together. A person high in both
                    Strategic and Interpersonal intelligence doesn't just have two strengths; they
                    have a compound advantage that neither line produces alone.
                  </p>
                  <p>
                    We identify these clusters and show you exactly how to deploy them toward your
                    stated goals. The second-order effects of combining your top lines optimally are
                    often more powerful than any individual strength — and most people never discover
                    them because no assessment has mapped the full architecture before.
                  </p>
                  <p>
                    Our AI coaching synthesis — five models working in combination — analyzes your
                    specific cluster patterns and generates prescriptions for how to use them together
                    in career decisions, relationship dynamics, creative output, and long-term planning.
                  </p>
                </div>
              </motion.div>
            </div>
            <div className="lg:col-span-2">
              <motion.div
                className="glass-card p-6 rounded-2xl"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Second-Order Effects
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-primary/[0.05] border border-primary/10">
                    <p className="text-xs text-primary/80 font-medium">Cluster Synergy</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      When two or more high lines share a domain, their combined output exceeds the sum of parts.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/[0.05] border border-primary/10">
                    <p className="text-xs text-primary/80 font-medium">Optimal Deployment</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Specific strategies for using your clusters toward career, relationships, and long-term outcomes.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/[0.05] border border-primary/10">
                    <p className="text-xs text-primary/80 font-medium">Compounding Returns</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Strength clusters that are deliberately exercised together grow faster than isolated lines.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Weakness Cluster Protection */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C85C44]/[0.02] to-transparent" />
        <div className="container relative z-10 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <motion.div
                className="glass-card p-6 rounded-2xl border-[#C85C44]/10"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-[#C85C44]" />
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    The Threat Model
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#C85C44]/[0.05] border border-[#C85C44]/10">
                    <p className="text-xs text-[#C85C44]/80 font-medium">Multiplicative Collapse</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      One weak line can reduce the output of the entire system — not additively, but geometrically.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#C85C44]/[0.05] border border-[#C85C44]/10">
                    <p className="text-xs text-[#C85C44]/80 font-medium">Invisible to the Owner</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dunning-Kruger: the weakest lines are precisely the ones you can't self-assess.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#C85C44]/[0.05] border border-[#C85C44]/10">
                    <p className="text-xs text-[#C85C44]/80 font-medium">Predictive Across Decades</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Longitudinal research shows childhood self-regulation predicts health, wealth, and relationships 30 years later.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="lg:col-span-3 order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p
                  className="text-xs uppercase tracking-[0.25em] text-[#C85C44]/60 mb-4"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Weakness Clusters
                </p>
                <h2
                  className="text-3xl sm:text-4xl text-foreground mb-6"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                >
                  Shield what threatens the system
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Your lowest-scoring intelligence lines aren't just areas for improvement — they're
                    <strong className="text-foreground"> structural vulnerabilities</strong> that can
                    undermine everything your strengths have built. A brilliant entrepreneur with low
                    self-regulation doesn't just "struggle with discipline" — they risk losing the
                    entire enterprise to a single uncontrolled impulse.
                  </p>
                  <p>
                    We identify your weakness clusters and assess the likelihood of them threatening
                    your system. Then we prescribe a five-step defense: <strong className="text-foreground">identify</strong> the
                    vulnerable lines, <strong className="text-foreground">shield</strong> them with
                    immediate structural protections, <strong className="text-foreground">bolster</strong> them
                    through targeted training (the research shows this produces permanent gains),
                    <strong className="text-foreground">insure</strong> against worst-case scenarios,
                    and <strong className="text-foreground">build in</strong> complementary relationships
                    that cover your gaps by design.
                  </p>
                  <p>
                    The evidence is clear: intelligence lines can be trained. The gains are permanent.
                    The quality-of-life improvements persist across decades. Your weaknesses are not
                    destiny — but left unattended, they will eventually control the outcome.
                  </p>
                </div>
                <div className="mt-6">
                  <PrefetchLink href="/weakness-finder">
                    <Button variant="outline" className="border-[#C85C44]/30 text-[#C85C44] hover:bg-[#C85C44]/10">
                      Explore the Weakness-Finder <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </PrefetchLink>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Complementary Matching */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.25em] text-accent/60 mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Complementary Matching
            </p>
            <h2
              className="text-3xl sm:text-4xl text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              Your weakness is someone else's strength
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              AQAL doesn't just score you — it connects you with people whose cognitive architecture
              naturally complements yours, creating relationships where both parties grow stronger
              by association.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              className="glass-card p-7 rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/[0.08] border border-primary/10 flex items-center justify-center text-primary mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Strength-to-Weakness Pairing
              </h3>
              <p className="text-muted-foreground/80 text-sm leading-relaxed">
                We match you with members whose top clusters align with your bottom clusters — and vice versa.
                By forming friendships and professional relationships with these people, their natural strengths
                begin to elevate your weak areas through proximity, conversation, and collaboration.
              </p>
            </motion.div>

            <motion.div
              className="glass-card p-7 rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-11 h-11 rounded-xl bg-accent/[0.08] border border-accent/10 flex items-center justify-center text-accent mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Structural Shielding
              </h3>
              <p className="text-muted-foreground/80 text-sm leading-relaxed">
                A complementary partner doesn't just teach you — they structurally protect you. Their
                strength in your weak area means they'll naturally notice threats you can't see, flag
                decisions you'd miss, and provide the perspective your architecture lacks.
              </p>
            </motion.div>

            <motion.div
              className="glass-card p-7 rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/[0.08] border border-primary/10 flex items-center justify-center text-primary mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Growth by Association
              </h3>
              <p className="text-muted-foreground/80 text-sm leading-relaxed">
                The research shows that sustained relationship with someone strong in your weak area
                produces measurable, permanent improvement in that line. Not through formal training —
                through friendship, conversation, and shared problem-solving. The relationship itself
                is the intervention.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="mt-12 glass-card p-8 rounded-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              We offer members the opportunity to reach out to their complementary matches and build
              genuine relationships — as friends, colleagues, collaborators, or accountability partners.
              The matching is the introduction. The growth happens naturally through the connection itself.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The AI Coaching Synthesis */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent" />
        <div className="container relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs uppercase tracking-[0.25em] text-primary/60 mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Evidence-Based Coaching
            </p>
            <h2
              className="text-3xl sm:text-4xl text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              Five AIs. One prescription.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Your coaching isn't generated by a single model with a single perspective. Five AI systems
              from different developers analyze your profile independently, then synthesize their
              recommendations into a unified prescription — reducing bias, increasing accuracy, and
              producing advice that no single system could generate alone.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/10">
                <h4 className="text-xs uppercase tracking-wider text-primary mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Strength Optimization
                </h4>
                <p className="text-sm text-muted-foreground">
                  How to deploy your top clusters toward your stated goals. Which combinations produce
                  the highest second-order returns. Where to invest your development energy for maximum impact.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#C85C44]/[0.05] border border-[#C85C44]/10">
                <h4 className="text-xs uppercase tracking-wider text-[#C85C44] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Weakness Shielding
                </h4>
                <p className="text-sm text-muted-foreground">
                  Specific strategies to protect against your vulnerability clusters. Structural
                  interventions, training protocols, and relationship prescriptions that reduce
                  your exposure to collapse scenarios.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-accent/[0.05] border border-accent/10">
                <h4 className="text-xs uppercase tracking-wider text-accent mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Relationship Matching
                </h4>
                <p className="text-sm text-muted-foreground">
                  Who to seek out, what to look for in collaborators, and how to build relationships
                  that structurally compensate for your architecture's gaps.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/10">
                <h4 className="text-xs uppercase tracking-wider text-primary mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Long-Term Planning
                </h4>
                <p className="text-sm text-muted-foreground">
                  How your intelligence architecture maps to career trajectories, life transitions,
                  and decade-scale outcomes. What to build now that compounds over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 32-Line Framework */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs uppercase tracking-[0.25em] text-primary/60 mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Theoretical Foundation
            </p>
            <h2
              className="text-3xl sm:text-4xl text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              32 independent dimensions
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Built on Ken Wilber's AQAL (All Quadrants, All Levels) integral theory. We measure
              cognitive, emotional, interpersonal, creative, volitional, and adaptive intelligences —
              the full spectrum of human capability across four quadrants.
            </p>
          </div>

          <motion.div
            className="glass-card p-8 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/10">
                <h4 className="text-xs uppercase tracking-wider text-primary mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Interior-Individual
                </h4>
                <p className="text-sm text-muted-foreground">
                  Logical, Mathematical, Philosophical, Reflective, Intuitive, Volitional intelligence
                </p>
              </div>
              <div className="p-4 rounded-xl bg-accent/[0.05] border border-accent/10">
                <h4 className="text-xs uppercase tracking-wider text-accent mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Exterior-Individual
                </h4>
                <p className="text-sm text-muted-foreground">
                  Kinesthetic, Spatial, Musical, Neo-Cognitive, Adaptive, Interoceptive intelligence
                </p>
              </div>
              <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/10">
                <h4 className="text-xs uppercase tracking-wider text-primary mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Interior-Collective
                </h4>
                <p className="text-sm text-muted-foreground">
                  Interpersonal, Intrapersonal, Linguistic, Empathic, Creative, Moral intelligence
                </p>
              </div>
              <div className="p-4 rounded-xl bg-aqal-purple/[0.05] border border-aqal-purple/10">
                <h4 className="text-xs uppercase tracking-wider text-aqal-purple mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Exterior-Collective
                </h4>
                <p className="text-sm text-muted-foreground">
                  Strategic, Ecological, Resilient, Architectural, Naturalistic, Entrepreneurial intelligence
                </p>
              </div>
            </div>
          </motion.div>

          <motion.p
            className="mt-8 text-center text-sm text-muted-foreground/70 italic max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Most assessments measure 1-10 dimensions. IQ tests measure one. CliftonStrengths measures 34 themes
            but only along a single axis of talent. AQAL measures 32 independent, uncorrelated lines of intelligence —
            producing a multiplicative rarity score that reflects the full architecture of your mind.
          </motion.p>
        </div>
      </section>

      {/* Meet the Founder */}
      <section className="py-20 px-4 border-t border-white/[0.04]">
        <div className="container max-w-5xl mx-auto">
          <motion.p
            className="text-xs uppercase tracking-[0.25em] text-accent/60 mb-10 text-center"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Meet the Founder
          </motion.p>

          <div className="grid md:grid-cols-[340px_1fr] gap-10 md:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            >
              <FounderPhoto />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <h2
                className="text-3xl sm:text-4xl text-foreground mb-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
              >
                Samuel A. Russell V
              </h2>
              <p className="text-sm uppercase tracking-[0.15em] text-accent/70 mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Founder · Financial Advisor · Platform Builder
              </p>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  For two decades, Sam Russell has sat across the table from people making the decisions that
                  shape a life — how to protect a family, fund a retirement, weather a downturn. Twenty years as a
                  financial advisor taught him that the numbers are the easy part. What actually determines the
                  outcome is the shape of the mind making the call.
                </p>
                <p>
                  A licensed advisor across insurance, Medicare, and retirement planning with{" "}
                  <a
                    href="https://www.drasswealthmanagement.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary transition-colors"
                  >
                    Drass Wealth Management
                  </a>
                  , and an advisor with{" "}
                  <a
                    href="https://www.elitetaxstrategists.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary transition-colors"
                  >
                    Elite Tax Strategists
                  </a>{" "}
                  for advanced, proactive tax planning across all 50 states, Sam built his career on reading
                  people well — and on a conviction that most of what makes someone exceptional never shows up
                  on a standard test.
                </p>
                <p>
                  AQAL Intelligence is where those two threads meet: the discipline of an advisor who has spent
                  twenty years underwriting real-world risk, and a genuine fascination with the full architecture
                  of human capability. He built it to measure the whole person — honestly, across all 32 lines —
                  the way he wishes every high-stakes decision could be understood.
                </p>
              </div>

              <blockquote className="mt-6 pl-4 border-l-2 border-primary/40 text-foreground/80 italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem" }}>
                &ldquo;A single number never told the whole story about a person. I built AQAL to measure the rest of it.&rdquo;
              </blockquote>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl text-foreground mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            Ready to discover your architecture?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Start with your voice. Verify with evidence. Maximize your strengths.
            Shield your vulnerabilities. Connect with minds that complete yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PrefetchLink href="/assessment">
              <Button
                size="lg"
                className="text-lg px-10 py-6 bg-primary text-white font-semibold glow-gold"
              >
                Begin Assessment
              </Button>
            </PrefetchLink>
            <PrefetchLink href="/research-library">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 border-accent/30 text-accent"
              >
                Read the Research
              </Button>
            </PrefetchLink>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
