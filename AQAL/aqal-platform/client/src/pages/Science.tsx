import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Brain, Layers, Shield } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { PrefetchLink } from "@/components/PrefetchLink";

const AXES = [
  "Logical", "Mathematical", "Spatial", "Linguistic", "Interpersonal",
  "Intrapersonal", "Musical", "Kinesthetic", "Naturalistic", "Strategic",
  "Tactical", "Adaptive", "Resilient", "Systematic", "Architectural",
  "Empathic", "Intuitive", "Meta-Cognitive", "Reflective", "Existential",
  "Philosophical", "Integrative"
];

const FOUNDATIONS = [
  {
    title: "Howard Gardner",
    subtitle: "Multiple Intelligences Theory",
    desc: "The foundational framework recognizing that intelligence is not a single number but a constellation of distinct cognitive abilities.",
  },
  {
    title: "Robert Sternberg",
    subtitle: "Triarchic Theory of Intelligence",
    desc: "Analytical, creative, and practical intelligence working in concert \u2014 the basis for our multi-dimensional scoring.",
  },
  {
    title: "Daniel Goleman",
    subtitle: "Emotional Intelligence",
    desc: "The recognition that interpersonal and intrapersonal awareness are measurable, trainable forms of intelligence.",
  },
  {
    title: "Ken Wilber",
    subtitle: "AQAL Framework",
    desc: "All Quadrants, All Levels \u2014 the integral theory that maps human development across every dimension simultaneously.",
  },
];

const METHODOLOGY = [
  {
    step: "01",
    title: "Voice Capture",
    desc: "Open-ended questions answered by voice eliminate the bias of multiple-choice testing. Your natural language reveals cognitive patterns invisible to traditional assessments.",
  },
  {
    step: "02",
    title: "Multi-Model Consensus",
    desc: "Your high-confidence result is scored by a panel of AI systems from different developers and countries \u2014 including Claude (Anthropic), GPT (OpenAI), Gemini (Google), Grok (xAI), Llama (Meta), and independent labs like Mistral (France), Cohere (Canada), and AI21 (Israel). Each scores independently; we take a consensus (trimmed mean, dropping the outlier) so no single model's quirks decide your result. The free preliminary pass uses one model; the multi-model consensus is what raises a verified result to high confidence.",
  },
  {
    step: "03",
    title: "32-Dimension Mapping",
    desc: "Each response is scored across 28 intelligence lines (producing real scores) plus 4 developmental stances (graded by stage, not amount), creating a high-resolution cognitive fingerprint.",
  },
  {
    step: "04",
    title: "Statistical Placement",
    desc: "Your composite profile is positioned against modeled population distributions to produce an estimated rarity \u2014 a research-based estimate of how uncommon a profile of this shape is, not an exact measurement.",
  },
  {
    step: "05",
    title: "Evidence Verification",
    desc: "Optional document upload lets a live research engine (Perplexity) and independent AI reviewers verify your claims against the public record — confirming real-world accomplishments before they boost your scores. Verification runs only in the high-confidence tier.",
  },
];

export default function Science() {
  useScrollReveal();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, oklch(0.14 0.02 55) 0%, oklch(0.13 0.02 55) 50%, oklch(0.12 0.02 55) 100%)`,
        }}
      />
      {/* Gradient mesh overlay */}
      <div className="gradient-mesh" />

      <PublicHeader />

      <main className="relative z-10 container section-spacing max-w-4xl px-4">
        {/* Hero */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/[0.1] border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="display-1 text-foreground mb-4">
            The Science Behind AQAL
          </h1>
          <p className="text-muted-foreground/70 max-w-xl mx-auto text-lg leading-relaxed">
            32 dimensions of intelligence, grounded in decades of research, measured through voice,
            verified through evidence.
          </p>
        </motion.div>

        {/* 32 Intelligence Dimensions */}
        <motion.section
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <h2 className="display-2 text-foreground mb-8">
            The 32 Intelligence Dimensions
          </h2>
          <p className="text-muted-foreground/60 text-sm max-w-2xl mb-6">
            28 scored lines produce real measurements (percentiles, calibration scores, stage estimates, or verified achievement floors). 4 developmental stances are graded by stage on the Spiral Dynamics ladder — they reveal your relationship to a capacity, not its amount, and never feed the rarity composite.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AXES.map((axis, i) => (
              <motion.div
                key={axis}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="glass-card rounded-xl p-4 text-center group"
              >
                <span
                  className="text-accent/60 text-[0.6rem] block mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground/90 text-sm font-medium">{axis}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <div className="section-divider" />

        {/* Academic Foundations */}
        <motion.section
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="display-2 text-foreground">
              Academic Foundations
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FOUNDATIONS.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-foreground font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-accent/70 text-xs mb-3 tracking-wide">{f.subtitle}</p>
                <p className="text-muted-foreground/60 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <div className="section-divider" />

        {/* Methodology */}
        <motion.section
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="display-2 text-foreground">
              Methodology
            </h2>
          </div>
          <div className="space-y-5">
            {METHODOLOGY.map((m, i) => (
              <motion.div
                key={m.step}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="glass-card rounded-2xl p-6 flex gap-5"
              >
                <span
                  className="text-3xl font-black text-primary/[0.15] shrink-0"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {m.step}
                </span>
                <div>
                  <h3 className="text-foreground font-semibold mb-2">{m.title}</h3>
                  <p className="text-muted-foreground/60 text-sm leading-relaxed">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <div className="section-divider-gold" />

        {/* Cluster & Network Science */}
        <motion.section
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="display-2 text-foreground">Your Lines Are a Network, Not a List</h2>
          </div>
          <p className="text-muted-foreground/70 leading-relaxed mb-8 max-w-2xl">
            Your 32 lines don't act alone — they reinforce, cap, and lift one another. The platform
            reads the whole shape using established systems science, then applies it to your profile.
            Where the <span className="text-foreground/90">method</span> is established research, we
            treat the <span className="text-foreground/90">specific ranking within your profile</span> as
            a model-based estimate, confirmed as our own data grows.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { h: "The controlling weakness", d: "Network-centrality science identifies which weakness has the most influence over the others — the one to shield first." },
              { h: "The weakest link", d: "Bottleneck and O-Ring theory: a single deficiency can cap your outcome no matter how strong the rest of your profile is." },
              { h: "The keystone strength", d: "Mutualism and keystone effects: sharpening the right strength can lift the entire shape, not just one line." },
              { h: "The highest-leverage move", d: "Leverage-point theory maps where a small, tracked change re-engineers the odds most — and if-then tracking keeps it from slipping." },
            ].map((c) => (
              <div key={c.h} className="glass-card rounded-2xl p-6">
                <h3 className="text-foreground font-semibold mb-2">{c.h}</h3>
                <p className="text-muted-foreground/60 text-sm leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground/50 text-sm mt-6">
            Every claim here is backed in the{" "}
            <Link href="/research-library"><span className="text-primary/80 hover:text-primary underline cursor-pointer">Research Library</span></Link>{" "}
            — with the skeptical papers included, so the science can be checked, not just cited.
          </p>
        </motion.section>

        <div className="section-divider-gold" />

        {/* Rarity Formula */}
        <motion.section
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="flex items-center gap-3 justify-center mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="display-3 text-foreground">
                The Rarity Formula
              </h2>
            </div>
            <div
              className="text-xl sm:text-2xl font-mono text-accent/80 mb-6 py-4 px-6 rounded-xl bg-muted/10 border border-muted/20 inline-block"
            >
              D<sub>M</sub> = &radic;((x&minus;&mu;)<sup>T</sup> &Sigma;<sup>&minus;1</sup> (x&minus;&mu;))
            </div>
            <p className="text-muted-foreground/60 text-sm max-w-lg mx-auto leading-relaxed">
              Your rarity estimate uses a Mahalanobis-style distance that accounts for correlations
              between axes (cognitive abilities share variance). The result is an estimated statistical
              distance from the population center — a research-based proxy for how uncommon your
              profile shape is, not a literal headcount.
            </p>
          </div>
        </motion.section>

        {/* Developmental Stages */}
        <motion.section
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="text-center mb-10">
            <p className="section-label text-accent/60 mb-2">Developmental Mapping</p>
            <h2 className="display-3 text-foreground">Stages of Consciousness</h2>
            <p className="text-muted-foreground/60 text-sm max-w-lg mx-auto mt-3">
              Your responses are mapped against the full spectrum of human developmental stages,
              from conventional to post-conventional to transpersonal. The 4 stance lines (Parenting, Seduction, Community-Founding, Financial-Self-Management) are graded here — by stage, not amount.
            </p>
          </div>
          <div className="grid gap-3 max-w-3xl mx-auto">
            {[
              { stage: "Blue", color: "#3b82f6", range: "0.10–0.25", pop: "~30%", desc: "Rule-based, conventional thinking. Loyalty to systems and authority." },
              { stage: "Orange", color: "#f97316", range: "0.25–0.50", pop: "~30%", desc: "Achievement-driven, strategic, scientific rationality. Most 'successful' people." },
              { stage: "Green", color: "#22c55e", range: "0.50–0.65", pop: "~20%", desc: "Pluralistic, empathic, egalitarian. Values community and shared meaning." },
              { stage: "Yellow", color: "#eab308", range: "0.65–0.85", pop: "~5%", desc: "Integrative, systemic, autonomous. Sees and synthesizes across all prior stages." },
              { stage: "Turquoise", color: "#06b6d4", range: "0.85–0.95", pop: "~0.1%", desc: "Holistic, communal wholeness. Perceives the world as a living, evolving system." },
              { stage: "Coral", color: "#f43f5e", range: "0.95–1.0", pop: "<0.01%", desc: "Third-Tier. Radical dis-identification from ego. Cosmocentric awareness with grounded embodiment. Holds paradox at the identity level." },
            ].map((s) => (
              <div key={s.stage} className="glass-card rounded-xl p-4 flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}40` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-semibold text-foreground">{s.stage}</span>
                    <span className="text-xs font-mono text-muted-foreground/50">{s.range}</span>
                    <span className="text-xs text-muted-foreground/40 ml-auto">{s.pop} of population</span>
                  </div>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <h2 className="display-2 text-foreground mb-4">
            Ready to discover your rarity?
          </h2>
          <p className="text-muted-foreground/60 mb-8 max-w-md mx-auto">
            The most comprehensive intelligence assessment ever created &mdash; completed in a 30–60 minute voice interview.
          </p>
          <PrefetchLink href="/assessment">
            <Button className="text-lg px-10 py-6 bg-primary text-white glow-gold hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150">
              Begin Assessment
            </Button>
          </PrefetchLink>
        </motion.div>
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <PublicFooter />
      </div>
    </div>
  );
}
