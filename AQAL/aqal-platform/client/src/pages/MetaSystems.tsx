import { motion } from "framer-motion";
import { Link } from "wouter";

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function MetaSystems() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
        <motion.p initial="hidden" animate="visible" variants={fadeIn} className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
          THE SYSTEMS BEHIND YOUR SYSTEMS
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-serif mb-6">
          Meta-Systems Architecture
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }} className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Every intelligence line you develop is governed by deeper systems — feedback loops, failure modes, signal detection, and scaling principles. This is the operating manual for the machine that runs the machine.
        </motion.p>
      </section>

      {/* 7-Layer Feedback Stack */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif mb-4">The 7-Layer Feedback Stack</h2>
          <p className="text-muted-foreground mb-8">Every system — from a single habit to an entire life — operates across these seven layers. Signals flow upward (sensemaking). Constraints flow downward (control). No layer can be silent.</p>
          <div className="space-y-3">
            {[
              { layer: 7, name: "Identity & Purpose", content: "Mission, values, long-term 'why'", up: "Existential fitness, meaning, coherence", down: "Constraints on models & strategy", delay: "Multi-year" },
              { layer: 6, name: "Models & Assumptions", content: "Beliefs, paradigms, theories", up: "Model validity vs identity", down: "Frames for strategies", delay: "Quarterly" },
              { layer: 5, name: "Strategies & Policies", content: "Plans, rules, resource allocation", up: "Performance, side effects", down: "Constraints on processes", delay: "Monthly" },
              { layer: 4, name: "Mechanisms & Processes", content: "Workflows, algorithms, playbooks", up: "Throughput, bottlenecks, failures", down: "Instructions for behavior", delay: "Weekly" },
              { layer: 3, name: "Behaviors & Operations", content: "Actions, interactions, micro-decisions", up: "Metrics, incidents", down: "Act on events & data", delay: "Daily" },
              { layer: 2, name: "Events & Data", content: "Observations, logs, measurements", up: "Raw evidence", down: "Context for environment", delay: "Real-time" },
              { layer: 1, name: "Environment / Reality", content: "Physical, social, market context", up: "Everything in the wild", down: "Boundary conditions", delay: "Continuous" },
            ].map((l, i) => (
              <motion.div key={l.layer} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-5 grid grid-cols-1 md:grid-cols-[60px_1fr_1fr_1fr_100px] gap-4 items-center">
                <div className="text-2xl font-bold text-primary/60">L{l.layer}</div>
                <div>
                  <div className="font-semibold text-sm">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.content}</div>
                </div>
                <div className="text-xs"><span className="text-green-400">↑</span> {l.up}</div>
                <div className="text-xs"><span className="text-amber-400">↓</span> {l.down}</div>
                <div className="text-xs text-muted-foreground">{l.delay}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-card/50 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              <strong>Design Rule:</strong> Any change at lower layers must have a defined feedback path up to at least Strategy. Any change in Identity must eventually alter Processes and Metrics — or it's ceremonial.
            </p>
          </div>
        </div>
      </section>

      {/* 10 Scaling Principles */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif mb-4">10 Principles for Scaling Feedback Loops</h2>
          <p className="text-muted-foreground mb-8">Complex systems get overwhelmed when every signal is treated as urgent. These principles prevent collapse at scale.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { num: 1, title: "Purpose-Specific Loops", rule: "Each loop has one function and one timescale — don't blur them together." },
              { num: 2, title: "Centralize Signals, Decentralize Actions", rule: "One source of truth for data; local actors decide adaptations." },
              { num: 3, title: "Tier by Timescale", rule: "Short (hours-days), Medium (weeks-months), Long (months-years). Assign each signal to a tier." },
              { num: 4, title: "Cap, Compress, Prune", rule: "3-5 key metrics per loop. Sunset what doesn't change decisions." },
              { num: 5, title: "Connect Feedback to Decisions", rule: "Define issue → decision path. Measure loop closure rate." },
              { num: 6, title: "Truth-Flow Architecture", rule: "Multiple channels, redundancy. Optimize signal quality over volume." },
              { num: 7, title: "Protect Against Runaway", rule: "Install balancing loops. Monitor early warning indicators for overheating." },
              { num: 8, title: "Embed Feedback Literacy", rule: "Train all participants to interpret signals, distinguish noise, and know which actions are theirs." },
              { num: 9, title: "Cross-Layer Coherence", rule: "Align metrics, narratives, and incentives across all layers." },
              { num: 10, title: "Test, Simulate, Rehearse", rule: "Pilot in small contexts. Run failure drills before full deployment." },
            ].map((p) => (
              <motion.div key={p.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded">{p.num}</span>
                  <h3 className="font-semibold text-sm">{p.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{p.rule}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 Failure Modes */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif mb-4">8 Predictable Failure Modes</h2>
          <p className="text-muted-foreground mb-8">High-density systems fail in predictable places. Know these patterns and you can prevent collapse before it starts.</p>
          <div className="space-y-4">
            {[
              { num: 1, mode: "Overload & Fidelity Collapse", quadrant: "LR → UR → UL", what: "Too many sessions, tasks, logs, and rules. Parents/users skip core components. Essential procedures get missed.", remedy: "Written pruning rule. Minimum viable routines for stress periods. Tiered intensity." },
              { num: 2, mode: "Treating Capacity as Compliance", quadrant: "UR only", what: "Evaluating 'did you follow the system' instead of 'does the system fit your capacity.' Behavior read as defiance instead of signal.", remedy: "Ask 'what capacity mismatch?' before 'who didn't comply?' Log structural barriers alongside adherence." },
              { num: 3, mode: "Cultural Misfit", quadrant: "LL + LR", what: "System built in one context gets copy-pasted without adaptation. Local values and norms clash with imported framework.", remedy: "Surface family/user beliefs. Adapt language. Acknowledge community norms. Allow script rewriting." },
              { num: 4, mode: "Ignoring Mental Health", quadrant: "UL + LL", what: "System focuses on 'what to do' without attending to depression, anxiety, trauma, or relationship strain.", remedy: "Brief repeated stress measure. Explicit threshold for reducing load. Permission to skip tasks for regulation." },
              { num: 5, mode: "Over-Monitoring, Under-Repairing", quadrant: "LR heavy", what: "Dashboards track everything but don't provide scripts for rupture-repair or real-time coaching.", remedy: "Each metric needs an adaptation rule. Feedback loops must be short (days/weeks). Exit criterion for useless metrics." },
              { num: 6, mode: "One-Size-Fits-All Intensity", quadrant: "LR", what: "Every user gets the same density regardless of risk level, stressors, or learning curve.", remedy: "At least 3 engagement levels. Families/users can move tiers without shame. Plug-in modules." },
              { num: 7, mode: "Weak Culture (R2)", quadrant: "LL + LR", what: "Success depends on a few motivated individuals rather than shared culture and supportive systems.", remedy: "Scripts written down and teachable. Handover protocol for when key people change. Policies support the system." },
              { num: 8, mode: "No Pruning Mechanism", quadrant: "LR + UL", what: "New rules added, old ones never removed. Complexity grows faster than benefit. Configuration rot.", remedy: "Written rule: remove/simplify one thing per month. Track what's never used. Sunset criteria for scaffolds." },
            ].map((f) => (
              <motion.div key={f.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded">#{f.num}</span>
                  <h3 className="font-semibold text-sm">{f.mode}</h3>
                  <span className="text-xs text-muted-foreground ml-auto">{f.quadrant}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{f.what}</p>
                <p className="text-xs"><span className="text-green-400 font-semibold">Remedy:</span> {f.remedy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Stage Feedback Loop Engineering */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif mb-4">Feedback Loop Engineering</h2>
          <p className="text-muted-foreground mb-8">Every effective feedback loop passes through four stages. Skip one and the loop breaks.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { stage: 1, name: "Evidence", desc: "Measure behavior, capture data, store in accessible format. What actually happened?", color: "text-blue-400" },
              { stage: 2, name: "Relevance", desc: "Relay information in emotionally resonant context. Not raw data — meaning.", color: "text-amber-400" },
              { stage: 3, name: "Consequence", desc: "Illuminate paths ahead. Tie to larger goals and purpose. What does this mean for your future?", color: "text-orange-400" },
              { stage: 4, name: "Action", desc: "Clear moment to recalibrate. Make a choice. Act. Then measure again.", color: "text-green-400" },
            ].map((s) => (
              <motion.div key={s.stage} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-card border border-border rounded-lg p-5 text-center">
                <div className={`text-3xl font-bold ${s.color} mb-2`}>{s.stage}</div>
                <h3 className="font-semibold text-sm mb-2">{s.name}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">Evidence → Relevance → Consequence → Action → Evidence (loop repeats)</p>
          </div>
        </div>
      </section>

      {/* Signal Detection OS */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif mb-4">Signal Detection Operating System</h2>
          <p className="text-muted-foreground mb-8">Where does the data come from? These are the sensors that feed your feedback loops.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { source: "Wearable HRV/EEG", quadrant: "UR", what: "Physiological state detection — stress, recovery, focus" },
              { source: "Habit Tracking Apps", quadrant: "UR", what: "Behavioral consistency — streaks, adherence, patterns" },
              { source: "Journal Mining (NLP)", quadrant: "UL", what: "Pattern extraction from written reflection — recurring themes, beliefs" },
              { source: "Decision Tracking Logs", quadrant: "UL + LR", what: "Prediction vs. outcome — calibration of judgment quality" },
              { source: "Peer Feedback Surveys", quadrant: "LL", what: "Cultural calibration — how others perceive your growth" },
              { source: "Conversation Analysis", quadrant: "LL + UR", what: "Sentiment, turn-taking, humor success, persuasion outcomes" },
              { source: "Financial API Dashboards", quadrant: "LR", what: "Resource tracking — spending alignment, savings rate, stress" },
              { source: "Calendar/CRM Tracking", quadrant: "LR", what: "Behavioral metrics — social interactions, commitments kept" },
              { source: "AI Panel Re-Assessment", quadrant: "All", what: "6-month comprehensive re-scoring across all 32 lines" },
              { source: "Loop Closure Rate", quadrant: "Meta", what: "What % of signals led to visible decisions? THE health metric." },
            ].map((s, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded shrink-0">{s.quadrant}</span>
                <div>
                  <h4 className="font-semibold text-sm">{s.source}</h4>
                  <p className="text-xs text-muted-foreground">{s.what}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metric */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-serif mb-4">The One Metric That Rules Them All</h2>
          <div className="bg-card border border-primary/30 rounded-lg p-8 mt-6">
            <p className="text-5xl font-bold text-primary mb-4">Loop Closure Rate</p>
            <p className="text-muted-foreground">What percentage of signals led to visible decisions?</p>
            <p className="text-sm text-muted-foreground mt-4">If this number is high, your system is alive. If it's low, you're collecting data nobody acts on — and the system is dying.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-border text-center">
        <p className="text-muted-foreground mb-4">Ready to map your own systems?</p>
        <Link href="/assessment">
          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Take the Assessment
          </button>
        </Link>
      </section>
    </div>
  );
}
