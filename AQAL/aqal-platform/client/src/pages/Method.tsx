import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layers, Link2, TrendingUp, Zap, Shield, Wrench, ArrowRight } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { PrefetchLink } from "@/components/PrefetchLink";

// ============================================================
// The Method — the meta-level thesis of the platform.
// "Engineer the strengths. Dismantle the weaknesses." Operating one level up,
// on the system that produces outcomes, grounded in the research already in the
// library (weakest-link/O-Ring, keystone/mutualism, leverage/centrality, the
// knowing–doing gap). Reframed voice: directionality, predictability, engineering.
// ============================================================

const PRINCIPLES = [
  {
    icon: Shield,
    title: "The weakest link caps the whole",
    body:
      "A profile is not the average of its lines. Liebig's Law of the Minimum and Kremer's O-Ring theory both say the same thing: one deficient component sets the ceiling no matter how strong the rest. That is why we find your controlling weakness first — the single line whose failure most predictably derails your goals — and dismantle it before adding to any strength.",
    tag: "Weakest-link & O-Ring",
  },
  {
    icon: Link2,
    title: "One strength lifts the rest",
    body:
      "Strengths don't just co-occur — they pull each other up. The mutualism model shows abilities reinforce each other over time, and keystone research shows a single sustained habit spilling into unrelated domains. So we don't scatter effort: we find the keystone strength and aim it at your #1 outcome, and the whole shape rises with it.",
    tag: "Keystone & mutualism",
  },
  {
    icon: TrendingUp,
    title: "The highest-leverage move",
    body:
      "Network psychometrics lets us estimate which node is most central — the one whose change propagates furthest. One tracked change at the controlling node re-engineers the odds more than ten scattered efforts. We frame it as a hypothesis, not a verdict (centrality is a signal, not proof), then test it against your own follow-through.",
    tag: "Leverage points & centrality",
  },
  {
    icon: Zap,
    title: "Knowing isn't doing",
    body:
      "Most people already know the answer — save more, sleep more, listen to their partner — and still don't do it. The gap is not knowledge; it is action. The evidence is blunt about the fix: turn each move into an if-then plan, stack it onto an existing habit, and track it. That is what converts intention into a result — and it is why the platform doesn't end at a report.",
    tag: "Implementation intentions",
  },
];

export default function Method() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="max-w-[1080px] mx-auto px-6 py-[clamp(56px,9vw,120px)]">
          <motion.p
            className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            The method · one level up
          </motion.p>
          <motion.h1
            className="font-display font-semibold leading-[1.02] text-[clamp(38px,6.5vw,72px)] mb-6"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
          >
            Engineer the strengths.{" "}
            <span className="text-primary">Dismantle the weaknesses.</span>
          </motion.h1>
          <motion.p
            className="text-[clamp(16px,2vw,21px)] text-muted-foreground max-w-[46em] leading-relaxed"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}
          >
            Every other test hands you a number and walks away. We work one level up — on the{" "}
            <span className="text-foreground font-medium">system</span> that produces your outcomes:
            which strengths to deploy, which weakness quietly caps you, and the single change that moves
            the most. Measure the mind. Map the system. Engineer the outcome.
          </motion.p>
          <motion.div
            className="flex gap-3 flex-wrap mt-8"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }}
          >
            <PrefetchLink href="/assessment">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] uppercase px-5 py-3 rounded bg-primary text-primary-foreground cursor-pointer">
                Measure yourself — free <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </PrefetchLink>
            <Link href="/research-library">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] uppercase px-5 py-3 rounded border border-border text-foreground cursor-pointer">
                See the research
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why the meta level */}
      <section className="border-b border-border">
        <div className="max-w-[1080px] mx-auto px-6 py-[clamp(48px,7vw,96px)]">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <p className="font-mono text-[10px] tracking-[0.26em] uppercase text-primary">Why the meta level</p>
          </div>
          <h2 className="font-display text-[clamp(26px,4vw,44px)] font-semibold leading-tight mb-5 max-w-[20em]">
            You don't have thirty-two separate problems. You have one system.
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-[15px] leading-relaxed text-muted-foreground max-w-[62em]">
            <p>
              Grinding on a single line in isolation is how most self-improvement fails — you pour effort
              into what's already strong, or into a weakness that wasn't the one holding you back. The
              gains don't compound because the parts interact, and you weren't operating on the interaction.
            </p>
            <p>
              Working at the meta level means asking a different question: given <em>your</em> stated
              outcomes, which line is the binding constraint, which strength is the multiplier, and what is
              the one move that changes the most? That is the difference between activity and leverage —
              and it is the entire premise of this platform.
            </p>
          </div>
        </div>
      </section>

      {/* The four principles */}
      <section className="border-b border-border">
        <div className="max-w-[1080px] mx-auto px-6 py-[clamp(48px,7vw,96px)]">
          <p className="font-mono text-[10px] tracking-[0.26em] uppercase text-primary mb-8">
            Four principles the research keeps proving
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-lg border border-border bg-secondary p-6">
                <p.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-display text-xl font-semibold mb-2">{p.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-muted-foreground mb-3">{p.body}</p>
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-primary/80">{p.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engineer / Dismantle — the two moves */}
      <section className="border-b border-border">
        <div className="max-w-[1080px] mx-auto px-6 py-[clamp(48px,7vw,96px)] grid md:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Engineer the strengths</h2>
            </div>
            <p className="text-[15px] leading-relaxed text-muted-foreground mb-3">
              Your highest lines form <span className="text-foreground font-medium">clusters</span> that
              amplify each other. We identify the keystone — the strength that most accelerates your
              declared goals — and show you how to point it there. The second-order combinations are often
              more powerful than any single line: Strategic × Interpersonal isn't "good at planning and
              people," it's the ability to architect social outcomes others can't see.
            </p>
            <p className="text-[13px] text-muted-foreground/70">
              Scaffold, don't scatter — deploy what's strong at the outcome that matters most.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Dismantle the weaknesses</h2>
            </div>
            <p className="text-[15px] leading-relaxed text-muted-foreground mb-3">
              Your lowest lines aren't "areas for improvement" — they're <span className="text-foreground font-medium">structural
              vulnerabilities</span> that can cap everything your strengths build. We name the controlling
              weakness, estimate how predictably it creates friction against your goals, then prescribe:
              <span className="text-foreground"> identify → shield</span> with structural protections →
              <span className="text-foreground"> bolster</span> through targeted training (the evidence shows
              lines are trainable, with gains that persist) → <span className="text-foreground">insure</span>
              against the worst case.
            </p>
            <p className="text-[13px] text-muted-foreground/70">
              Fix the binding constraint first — it lifts everything downstream.
            </p>
          </div>
        </div>
      </section>

      {/* Honesty */}
      <section className="border-b border-border">
        <div className="max-w-[1080px] mx-auto px-6 py-[clamp(40px,6vw,80px)]">
          <p className="font-mono text-[10px] tracking-[0.26em] uppercase text-primary mb-4">The honest part</p>
          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-[60em]">
            None of this is a guarantee. Every projection is directional and model-based; centrality is a
            hypothesis, not proof; trainability is real but not magic; and anything you self-report through
            the tracker is taken at your word, not independently re-measured. That candor is deliberate —
            the research library carries the nulls and the debunked claims at their real weight, because a
            method you can trust is worth more than one that flatters you.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="max-w-[1080px] mx-auto px-6 py-[clamp(48px,8vw,110px)] text-center">
          <h2 className="font-display text-[clamp(28px,4.5vw,52px)] font-semibold leading-tight mb-4">
            Discover your architecture. <span className="text-primary">Deploy it.</span>
          </h2>
          <p className="text-[16px] text-muted-foreground max-w-[38em] mx-auto mb-8">
            Measure all thirty-two lines, find your controlling weakness and keystone strength, and get the
            research-backed moves — individualized to the outcomes you name.
          </p>
          <PrefetchLink href="/assessment">
            <span className="inline-flex items-center gap-1.5 font-mono text-[12px] tracking-[0.12em] uppercase px-7 py-4 rounded bg-primary text-primary-foreground cursor-pointer">
              Begin the assessment — free <ArrowRight className="w-4 h-4" />
            </span>
          </PrefetchLink>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
