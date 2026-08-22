// ============================================================
// CAPACITY AXES — the eight engine capacities that don't map to
// one of the 32 public display lines. They exist in the scoring
// engine and the therapy map (every one has protocols that build
// it), but until now had no landing page of their own. These are
// OUR framework's definitions — how the engine construes each
// axis when scoring spoken evidence — presented as framework,
// not as externally validated constructs. The protocols listed
// on each page carry their own citations.
// ============================================================

export type CapacityAxis = {
  name: string;      // engine name, matches THERAPY_LINE_MAP lines
  what: string;      // the definition our engine scores against
  missed: string;    // why conventional testing never measures it
  strong: string;    // what it looks like when it's strong
  weak: string;      // what it costs when it's weak
};

export const CAPACITY_AXES: Record<string, CapacityAxis> = {
  Adaptive: {
    name: "Adaptive",
    what: "The capacity to keep functioning when the plan dies — updating beliefs, switching strategies, and staying workable under changed conditions instead of defending the old map. Our engine scores it from how you narrate disruptions: whether the story bends or the facts do.",
    missed: "Tests measure you inside a fixed format with known rules — the one environment where adaptivity is invisible. There is no standardized test whose questions change their own rules midway, so the capacity that handles exactly that has no score anywhere in your file.",
    strong: "Plans are drafts; feedback lands as information rather than insult; pivots happen early, before the sunk costs pile up. Strong adaptives are often mistaken for lucky people — the luck is a faster update cycle.",
    weak: "The same solution gets applied harder as it works less; identity fuses with strategy, so changing course feels like self-betrayal. A weak adaptive line converts every changed circumstance into a personal crisis, at compounding cost.",
  },
  Architectural: {
    name: "Architectural",
    what: "The capacity to design structures that hold — systems, routines, organizations, plans whose parts bear load and whose interfaces don't leak. Our engine scores it from how you describe things you've built: whether the design has load paths or just intentions.",
    missed: "School grades the essay, never the outline's engineering; work reviews outcomes, rarely the structure that produced them. Design quality hides inside results, so the person who builds sound structures gets credited for effort instead of architecture.",
    strong: "Things you set up keep working when you're not watching them. Strong architecturals build routines that survive bad weeks and teams that survive their founders — the signature is durability without supervision.",
    weak: "Everything depends on heroic maintenance: systems that collapse the week you get sick, plans that need you present to function. A weak architectural line means you are the load-bearing wall in everything you build — which caps everything you build at your own fatigue.",
  },
  Integrative: {
    name: "Integrative",
    what: "The capacity to hold multiple frameworks at once and synthesize across them — joining perspectives that don't share vocabulary into a picture none of them contains alone. Our engine scores it from how many honest frames your answers can inhabit before collapsing into one.",
    missed: "Every test lives inside a single discipline's frame, so cross-frame synthesis — the thing polymaths actually do — is structurally unmeasurable by any of them. The capacity for joining fields has no home in a system organized by fields.",
    strong: "You translate between specialists who can't hear each other; contradictions read as coordinates rather than errors. Strong integratives are the people in whom other people's half-ideas become whole.",
    weak: "One framework becomes the world: every problem gets that hammer, every dissent sounds like nonsense. A weak integrative line doesn't feel like a weakness from inside — it feels like clarity, which is what makes it expensive.",
  },
  Intuitive: {
    name: "Intuitive",
    what: "The capacity for fast pattern recognition below the level of articulation — reliable reads that arrive before their reasons do. Our engine scores it honestly: intuition counts as intelligence only where your track record shows the reads were right, in domains with real feedback.",
    missed: "Tests demand shown work, and intuition's defining feature is that the work doesn't show. The literature is blunt that intuition is only trustworthy in high-validity environments — which is exactly the calibration no standardized instrument measures.",
    strong: "In your trained domains, your first read is data: you feel the wrong contract, the off diagnosis, the good hire, early. Strong intuitives with honest feedback loops are what expertise looks like from outside.",
    weak: "Either every hunch is trusted (including the ones from low-feedback domains where hunches are noise) or none are — both miscalibrations. A weak intuitive line pays twice: false alarms acted on, real signals argued away.",
  },
  Philosophical: {
    name: "Philosophical",
    what: "The capacity to examine premises — to ask what a claim assumes, what a value trades against, what a question smuggles in — and to keep functioning amid genuinely open questions. Our engine scores it from whether your reasoning can find and name its own ground.",
    missed: "Tests need answer keys, and premise-examination is precisely the move that questions answer keys. The capacity is not just unmeasured but structurally punished by timed assessment — the student who interrogates the question loses points to the one who accepts it.",
    strong: "You catch the assumption doing the real work in an argument; hard questions are habitable rather than threatening. Strong philosophicals are the people who notice the frame while everyone else fights inside it.",
    weak: "Borrowed premises run your life unexamined — inherited definitions of success, unquestioned trade-offs, values chosen by whoever spoke first. A weak philosophical line means your deepest decisions were made by defaults you never saw.",
  },
  Reflective: {
    name: "Reflective",
    what: "The capacity to observe your own thinking and revise it — noticing your patterns, auditing your reasoning after the fact, converting experience into updated method. Our engine scores it from whether your accounts of past decisions contain a self who learned.",
    missed: "No test measures what you do after the test: whether the errors became information. Reflection happens in the untimed, unobserved hours — the exact hours every assessment instrument excludes by design.",
    strong: "Mistakes get autopsied instead of buried; the same error rarely bills you twice. Strong reflectives improve at improving — the only compounding rate that applies to every other line at once.",
    weak: "Experience accumulates without converting: ten years become one year repeated ten times. A weak reflective line is why smart people plateau — the engine that turns living into learning is the one that's idle.",
  },
  Resilient: {
    name: "Resilient",
    what: "The capacity to absorb a real blow and return to function — not the absence of damage but the reliability of recovery: how far you bend, how fast you reorganize, what you rebuild from. Our engine scores it from how your hardest chapters resolve in the telling.",
    missed: "Assessment happens on your scheduled, rested, prepared days — the days resilience is invisible. The capacity only appears in the unscheduled disasters no instrument attends, so the most consequential line in a hard life goes unmeasured in every file.",
    strong: "Setbacks have a half-life: grief and failure are metabolized rather than enshrined or denied. Strong resilients aren't unbreakable — they're re-organizable, which outperforms unbreakable everywhere it's been studied.",
    weak: "One bad event colonizes years; every risk gets priced at catastrophe because recovery can't be counted on. A weak resilient line quietly shrinks a life — not through disasters, but through everything not attempted to avoid them.",
  },
  Tactical: {
    name: "Tactical",
    what: "The capacity to act well inside the next five minutes — reading a live situation, sequencing moves, exploiting the opening that exists now rather than the plan made yesterday. Our engine scores it from how you narrate fast decisions: whether the moves answer the situation or the script.",
    missed: "Strategy gets books and tests; tactics happen too fast for either. Timed tests measure speed on abstract items, not situational moves under live pressure — chess has a rating for this capacity; life doesn't.",
    strong: "In the room, you find the move: the question that reopens a dead negotiation, the resequencing that saves a failing day. Strong tacticals make strategy look better than it was.",
    weak: "Good plans die on contact because contact was never the plan: openings pass unseen, pressure collapses sequencing. A weak tactical line means your outcomes systematically underperform your preparation — the gap is the execution layer.",
  },
};
