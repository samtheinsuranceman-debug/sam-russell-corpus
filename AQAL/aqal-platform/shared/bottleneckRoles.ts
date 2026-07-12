// ============================================================
// Bottleneck roles — WHY a given weak line drags the whole system
// ============================================================
// The Effective Potential number tells you THAT your weakest lines cost you.
// This tells you HOW: every line, when it is your constraint, fails through one
// of three well-studied mechanisms. Naming the mechanism is what turns a score
// into a diagnosis.
//
//   liebig — Liebig's Law of the Minimum. A limiting resource that sets the
//            "barrel height": sustained output is capped by this one stave no
//            matter how tall the others are. (self-regulation, purpose, stamina)
//
//   oring  — Kremer's O-Ring. Quality is MULTIPLICATIVE: one low-quality node
//            degrades every downstream output at once. A single weak link here
//            doesn't subtract — it divides. (collaboration, ethics, data hygiene)
//
//   toc    — Theory of Constraints (Goldratt). The throughput bottleneck: the
//            slowest step in the chain governs the whole system's rate; capacity
//            elsewhere is stranded behind it. (cognitive load, execution, design)
//
// This is a conceptual mapping, not a citation set — it operationalizes the
// weakest-link literature already in the Research Library (sys-weakest-link,
// sys-centrality clusters). It is deterministic, so it runs on the free tier.

export type BottleneckMechanism = "liebig" | "oring" | "toc";

export type BottleneckRole = {
  mechanism: BottleneckMechanism;
  /** short mechanism name for the UI chip */
  label: string;
  /** plain-language failure mode when THIS line is the constraint */
  failureMode: string;
};

export const MECHANISM_META: Record<
  BottleneckMechanism,
  { label: string; gist: string }
> = {
  liebig: {
    label: "Liebig stave",
    gist: "A limiting resource — it sets your barrel height. Everything above it is capped until you raise this stave.",
  },
  oring: {
    label: "O-Ring",
    gist: "Multiplicative quality — one weak node degrades every downstream output at once. It divides, it doesn't subtract.",
  },
  toc: {
    label: "Throughput constraint",
    gist: "The slowest step in the chain — capacity everywhere else is stranded behind it until it's widened.",
  },
};

// Every one of the 32 axes mapped to its bottleneck mechanism + failure mode.
// Grouped by family so the reasoning is auditable.
export const BOTTLENECK_ROLE: Record<string, BottleneckRole> = {
  // ─── Cognitive / throughput — capacity is the narrowest channel (TOC) ───────
  Logical:       { mechanism: "toc", label: "Throughput constraint", failureMode: "Cognitive load becomes the narrowest channel — complex work stalls behind limited reasoning bandwidth even when everything else is strong." },
  Mathematical:  { mechanism: "toc", label: "Throughput constraint", failureMode: "Quantitative capacity caps how much complexity you can actually push through, no matter how motivated you are." },
  Spatial:       { mechanism: "toc", label: "Throughput constraint", failureMode: "Weak spatial/model-building bandwidth limits how large a system you can hold and manipulate at once." },
  Linguistic:    { mechanism: "toc", label: "Throughput constraint", failureMode: "Expressive bandwidth throttles how fast ideas convert into shared understanding — the chain waits on articulation." },
  "Meta-Cognitive": { mechanism: "liebig", label: "Liebig stave", failureMode: "Poor calibration sets a low ceiling on judgment: you can't allocate effort well if you don't know what you don't know." },
  Strategic:     { mechanism: "toc", label: "Throughput constraint", failureMode: "Without strategic sequencing, capable lines are spent on the wrong step and throughput collapses at the plan level." },
  Tactical:      { mechanism: "toc", label: "Throughput constraint", failureMode: "Execution stalls at the 'do the thing' phase — the slowest reaction in the chain." },
  Systematic:    { mechanism: "toc", label: "Throughput constraint", failureMode: "Weak process design makes the whole system low-throughput — individual lines can be sophisticated but trapped in a bad structure." },
  Architectural: { mechanism: "toc", label: "Throughput constraint", failureMode: "Poor system design acts as a macro bottleneck: sophisticated components stay stranded inside a structure that can't move them." },

  // ─── Self-regulation / limiting stave — sets barrel height (Liebig) ─────────
  Intrapersonal: { mechanism: "liebig", label: "Liebig stave", failureMode: "Weak self-regulation sets the barrel height — attention, emotion, and habit lapses become the limiting factor even when raw ability is high." },
  Volitional:    { mechanism: "liebig", label: "Liebig stave", failureMode: "Poor goal-pursuit is the classic weakest link: many capable lines go underused because the execution line can't carry them into sustained action." },
  Resilient:     { mechanism: "liebig", label: "Liebig stave", failureMode: "Low resilience caps sustained output — capability is constrained by lapses and burnout, not by talent." },
  Interoceptive: { mechanism: "liebig", label: "Liebig stave", failureMode: "Weak internal signal-reading limits self-management: you can't regulate a state you can't feel, and the barrel drains quietly." },
  Adaptive:      { mechanism: "liebig", label: "Liebig stave", failureMode: "Rigidity under change sets the ceiling — strengths built for one context can't be redeployed when conditions shift." },
  Reflective:    { mechanism: "liebig", label: "Liebig stave", failureMode: "Without reflective processing, lessons don't compound — the same constraint recurs and caps long-run growth." },

  // ─── Relational / multiplicative quality (O-Ring) ───────────────────────────
  Interpersonal: { mechanism: "oring", label: "O-Ring", failureMode: "In high-complementarity team work, one weak or uncooperative node dominates the fault pattern — collaboration quality multiplies across everyone's output." },
  Empathic:      { mechanism: "oring", label: "O-Ring", failureMode: "Low empathic read degrades every interaction at once — trust breaks propagate downstream and collapse value other lines created." },
  Influence:     { mechanism: "oring", label: "O-Ring", failureMode: "Weak influence means strong ideas don't move others — the multiplier on all your other lines drops to near zero." },
  Intuitive:     { mechanism: "oring", label: "O-Ring", failureMode: "Poor pattern-intuition quietly corrupts many judgments at once rather than failing loudly on one." },
  Adversarial:   { mechanism: "oring", label: "O-Ring", failureMode: "Weak red-teaming lets one bad assumption multiply across a whole plan before anyone catches it." },

  // ─── Purpose / meaning stave (Liebig) ───────────────────────────────────────
  Existential:   { mechanism: "liebig", label: "Liebig stave", failureMode: "Weak sense of purpose creates chronic motivational bottlenecks — throughput and persistence are limited by the 'will to continue,' regardless of technical skill." },
  Philosophical: { mechanism: "liebig", label: "Liebig stave", failureMode: "Without a coherent frame, long-horizon projects lose their 'purpose constraint' and stall before they compound." },
  Integrative:   { mechanism: "liebig", label: "Liebig stave", failureMode: "Failure to integrate perspectives caps meaning-making — the highest lines can't be organized toward a single aim." },

  // ─── Embodied execution / stamina stave (Liebig) ────────────────────────────
  Kinesthetic:   { mechanism: "liebig", label: "Liebig stave", failureMode: "Low physical reliability limits performance in domains requiring sustained execution — even if cognitive and interpersonal lines are strong." },
  Musical:       { mechanism: "liebig", label: "Liebig stave", failureMode: "Underused expressive capacity limits the range of states you can access and sustain under load." },
  Aesthetic:     { mechanism: "liebig", label: "Liebig stave", failureMode: "Low aesthetic discrimination caps the quality ceiling of what you'll accept as 'done.'" },
  Naturalistic:  { mechanism: "liebig", label: "Liebig stave", failureMode: "Weak environmental attunement limits how well you read and use the context you operate in." },
  Humor:         { mechanism: "oring", label: "O-Ring", failureMode: "Without humor as a release valve, social tension compounds and degrades collaboration quality across the board." },

  // ─── Ethics / trust — multiplicative collapse (O-Ring) ──────────────────────
  // (No single 'moral' axis; the closest developmental lines carry this role.)

  // ─── Stance lines — real constraints, excluded from rarity but still diagnosable ──
  Parenting:                   { mechanism: "liebig", label: "Liebig stave", failureMode: "Weak long-horizon caretaking capacity limits the systems (families, teams) you can sustain over time." },
  Seduction:                   { mechanism: "oring", label: "O-Ring", failureMode: "Low rapport-building degrades the quality of every first impression and connection at once." },
  "Community-Founding":        { mechanism: "toc", label: "Throughput constraint", failureMode: "Weak collective system-design makes the group the bottleneck — individuals can be sophisticated but trapped in a low-throughput structure." },
  "Financial-Self-Management": { mechanism: "toc", label: "Throughput constraint", failureMode: "Poor capital throughput strands every other capability behind a resource constraint." },
};

// Default when a line has no explicit mapping — treat as a throughput constraint,
// the most conservative (least dramatic) mechanism.
const DEFAULT_ROLE: BottleneckRole = {
  mechanism: "toc",
  label: "Throughput constraint",
  failureMode: "This line, when weakest, caps how much of your other capability actually reaches your outcomes.",
};

export function bottleneckRole(axis: string): BottleneckRole {
  return BOTTLENECK_ROLE[axis] ?? DEFAULT_ROLE;
}
