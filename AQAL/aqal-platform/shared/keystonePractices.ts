// ============================================================
// Keystone practices — the prescribable menu behind the coaching
// ============================================================
// Every entry is a research-backed practice that lives in the Research Library
// (see section numbers). The outcome-engineering coach draws prescribed moves
// from THIS menu so its advice is specific, cited, and honest — not generic.
//
// Each practice also carries the fields that power an honest OUTCOME PROJECTION:
//   horizon       — the recommended length of time to run the behavior
//   researchBasis — the real, headline finding (what the evidence actually shows)
//   evidence      — tier, which maps to the projection's confidence band
// A projection is an explicitly HYPOTHETICAL, confidence-tiered glimpse of what
// the person could expect IF they implement — never a guarantee.

export type KeystonePractice = {
  id: string;
  name: string;
  section: string;        // Research Library section number
  librarySection: string; // display label (the "read this" topic)
  evidence: "Strong" | "Moderate" | "Emerging";
  lifts: string[];        // lines / clusters it bolsters
  prescription: string;   // the concrete, honest "do this"
  horizon: string;        // recommended time to run it
  researchBasis: string;  // the honest headline finding
  goalKeywords: string[]; // words in a person's stated goals that make it relevant
};

export const KEYSTONE_PRACTICES: KeystonePractice[] = [
  // ─── Universal meta-systems (relevant to almost any goal) ───────────────────
  {
    id: "sleep", name: "Sleep protection", section: "14", librarySection: "Sleep — The Foundational System",
    evidence: "Strong", lifts: ["memory", "emotion", "decision-making", "self-regulation"],
    prescription: "Protect 7–9h with regular timing — the single highest-leverage move, because sleep gates every other line.",
    horizon: "2–4 weeks to feel it, ongoing to keep it",
    researchBasis: "Even mild chronic sleep restriction accumulates measurable cognitive and emotional-regulation deficits; restoring it reverses them.",
    goalKeywords: ["focus", "energy", "health", "performance", "stress", "burnout", "memory", "productivity", "discipline"],
  },
  {
    id: "exercise", name: "Aerobic exercise", section: "13", librarySection: "Aerobic Exercise — The Proven Keystone",
    evidence: "Strong", lifts: ["cognition", "memory", "mood", "resilience", "self-regulation"],
    prescription: "Regular aerobic training (the best-evidenced brain intervention) to lift cognition, mood, and resilience together.",
    horizon: "6–12 weeks for cognitive/mood gains",
    researchBasis: "In randomized trials, aerobic training improved memory and executive function and had a large antidepressant effect.",
    goalKeywords: ["focus", "energy", "health", "mood", "memory", "performance", "depression", "discipline", "productivity", "fitness"],
  },
  {
    id: "interoception", name: "Interoception / floatation practice", section: "12", librarySection: "Interoception — The Cross-Line Keystone",
    evidence: "Moderate", lifts: ["interoceptive", "empathic", "intrapersonal", "decision-making"],
    prescription: "Train interoception (breath/body attention, or floatation) — one practice that plausibly lifts self-regulation, empathy, and intuition via the shared insula hub.",
    horizon: "4–8 weeks of regular practice",
    researchBasis: "Interoceptive training and floatation reliably raise body-awareness and lower anxiety; the insula hub links it to empathy and decision-making.",
    goalKeywords: ["emotion", "anxiety", "intuition", "self-awareness", "calm", "stress", "regulation", "empathy", "mindfulness"],
  },
  {
    id: "breathwork", name: "Breathwork / HRV", section: "15", librarySection: "Breathwork & HRV — Autonomic Self-Regulation",
    evidence: "Moderate", lifts: ["self-regulation", "attention", "emotion"],
    prescription: "Brief daily slow-breathing (e.g. cyclic sighing) to raise vagal tone and improve emotional control and focus.",
    horizon: "5 min/day for ~4 weeks",
    researchBasis: "A randomized trial found five minutes of daily cyclic-sighing beat mindfulness meditation for mood and physiological arousal over a month.",
    goalKeywords: ["stress", "anxiety", "focus", "calm", "regulation", "emotion", "burnout", "performance"],
  },
  {
    id: "nature", name: "Nature exposure", section: "16", librarySection: "Nature Exposure — Attention Restoration",
    evidence: "Moderate", lifts: ["attention", "mood", "creativity"],
    prescription: "~2 hours/week in natural settings to restore attention, lower rumination, and lift mood — passive and low-effort.",
    horizon: "~2 hours/week, ongoing",
    researchBasis: "A ~2-hour weekly threshold is associated with better health and wellbeing; a single nature walk lowered rumination and its brain signature.",
    goalKeywords: ["stress", "creativity", "focus", "mood", "rumination", "burnout", "wellbeing"],
  },
  {
    id: "thermal", name: "Thermal stress (sauna)", section: "17", librarySection: "Thermal Stress — Sauna & Cold",
    evidence: "Moderate", lifts: ["resilience", "mood", "healthspan"],
    prescription: "Regular sauna use (strong cohort evidence for brain and cardiovascular healthspan); cold exposure is real acute but over-hyped for durable gains.",
    horizon: "several sessions/week, over months",
    researchBasis: "Large cohorts link frequent sauna use to substantially lower dementia and cardiovascular mortality (observational).",
    goalKeywords: ["resilience", "health", "longevity", "stress", "mood", "fitness"],
  },
  {
    id: "psychedelic", name: "Psychedelic-assisted therapy (documented, not prescribed)", section: "18", librarySection: "Psychedelic-Assisted Therapy — Deep but Gated",
    evidence: "Emerging", lifts: ["openness", "meaning", "mood"],
    prescription: "Documented for durable openness and mood change under strict medical supervision — we DOCUMENT this, we do not prescribe it. Legal, screening, and safety constraints apply.",
    horizon: "n/a — not a self-practice",
    researchBasis: "Supervised psilocybin has produced durable increases in openness and sustained reductions in depression/anxiety in trials — under medical control only.",
    goalKeywords: ["meaning", "openness", "depression", "transformation", "purpose"],
  },

  // ─── Social / relational lines ──────────────────────────────────────────────
  {
    id: "nonverbal", name: "Nonverbal-decoding practice", section: "19", librarySection: "Reading People — Nonverbal Decoding",
    evidence: "Moderate", lifts: ["interpersonal", "empathic", "intuitive"],
    prescription: "Deliberate emotion-reading practice (validated to improve nonverbal decoding). Watching muted interaction is a plausible but UNTESTED exercise — try it, don't bank on it.",
    horizon: "a few weeks of deliberate practice",
    researchBasis: "A meta-analysis found person-perception training reliably improves the accuracy of reading others' nonverbal cues.",
    goalKeywords: ["relationship", "social", "leadership", "sales", "team", "communication", "dating", "negotiation", "influence"],
  },

  // ─── Couples / marriage / parenting (the abundant relational set) ────────────
  {
    id: "relationship-media", name: "Watch + discuss relationship media", section: "20", librarySection: "Couples, Relationships & Parenting",
    evidence: "Strong", lifts: ["marital", "empathic", "interpersonal"],
    prescription: "With your partner, WATCH and DISCUSS relationship films regularly (the Rogge protocol — halved the 3-year divorce rate; the discussion is the active ingredient).",
    horizon: "5 films with discussion over ~1 month",
    researchBasis: "In a randomized trial, newlyweds who watched and discussed five relationship movies cut their 3-year divorce/separation rate roughly in half (24% → 11%) — matching intensive therapy.",
    goalKeywords: ["marriage", "spouse", "partner", "relationship", "divorce", "wife", "husband", "romance", "dating"],
  },
  {
    id: "empathy-training", name: "Empathy & perspective-taking practice", section: "20", librarySection: "Couples, Relationships & Parenting",
    evidence: "Moderate", lifts: ["empathic", "interpersonal"],
    prescription: "Structured perspective-taking practice (imagining the other's experience) — a meta-analysis of RCTs shows empathy is trainable; maintain it with repetition.",
    horizon: "weeks of repeated practice",
    researchBasis: "A meta-analysis of randomized trials found empathy training produces a moderate, reliable increase in empathy.",
    goalKeywords: ["relationship", "empathy", "conflict", "team", "parenting", "leadership", "marriage", "communication"],
  },
  {
    id: "relationship-education", name: "Communication & conflict skills", section: "20", librarySection: "Couples, Relationships & Parenting",
    evidence: "Moderate", lifts: ["marital", "interpersonal", "intrapersonal"],
    prescription: "Practice validated communication/conflict-management skills (speaker–listener, repair attempts) — relationship education lowers marital distress, especially with regular practice.",
    horizon: "a structured program over 1–3 months",
    researchBasis: "Meta-analyses show relationship education reliably improves couples' communication and lowers marital distress, strongest for higher-risk couples.",
    goalKeywords: ["marriage", "relationship", "communication", "conflict", "spouse", "partner"],
  },
  {
    id: "parenting", name: "Parenting-skill practice", section: "20", librarySection: "Couples, Relationships & Parenting",
    evidence: "Moderate", lifts: ["parental", "empathic", "intrapersonal"],
    prescription: "Practice the validated parenting components — warm-and-structured (authoritative) style, emotional communication, positive interaction — WITH your own child (practice beats concepts).",
    horizon: "a program of several weeks, practiced daily",
    researchBasis: "Meta-analyses of parent-training identify the active ingredients (emotional communication, positive interaction, practicing with your own child) that reliably improve child outcomes.",
    goalKeywords: ["parent", "child", "children", "kids", "family", "son", "daughter", "fatherhood", "motherhood"],
  },

  // ─── The universal bottleneck: closing the knowing–doing gap ─────────────────
  {
    id: "implementation", name: "Close the knowing–doing gap (implementation science)", section: "21", librarySection: "Knowing vs. Doing — Making It Stick",
    evidence: "Strong", lifts: ["volitional", "self-regulation", "follow-through"],
    prescription: "Convert every prescription into an if-then plan ('If it's 8pm Tuesday, then we watch our film'), stack it onto an existing habit, and track it. This is the step that turns knowing into doing.",
    horizon: "set up now; ~66 days to automaticity",
    researchBasis: "Implementation intentions (if-then plans) have a medium-to-large effect on actually enacting goals across 90+ studies; habits take a median of ~66 days to form.",
    goalKeywords: ["habit", "consistency", "discipline", "follow-through", "procrastination", "stick", "commit", "change", "goal"],
  },
];

// Evidence tier → the confidence band of an outcome PROJECTION. Honest mapping:
// stronger evidence = higher confidence in the DIRECTION, never a promise of magnitude.
export function confidenceFromEvidence(e: KeystonePractice["evidence"]): "Low" | "Moderate" | "High" {
  return e === "Strong" ? "High" : e === "Moderate" ? "Moderate" : "Low";
}

export type OutcomeProjection = {
  goalArea: string;
  practice: string;
  horizon: string;
  confidence: "Low" | "Moderate" | "High";
  researchBasis: string;
  librarySection: string;
};

// Build honest, confidence-tiered projections for a person's goals: the practices
// whose keywords match, each expressed as an explicitly hypothetical "if you commit
// for <horizon>, the evidence points this way, at <confidence> confidence".
export function buildProjections(goals: string, max = 4): OutcomeProjection[] {
  const g = (goals || "").trim();
  const area = g ? "your stated goals" : "your outcomes";
  const matched = practicesForGoals(g);
  const list = matched.length ? matched : corePractices();
  return list.slice(0, max).map((p) => ({
    goalArea: area,
    practice: p.name,
    horizon: p.horizon,
    confidence: confidenceFromEvidence(p.evidence),
    researchBasis: p.researchBasis,
    librarySection: p.librarySection,
  }));
}

// Practices whose goal-keywords appear in the person's stated goals.
export function practicesForGoals(goals: string): KeystonePractice[] {
  const g = (goals || "").toLowerCase();
  if (!g.trim()) return [];
  return KEYSTONE_PRACTICES.filter((p) => p.goalKeywords.some((k) => g.includes(k)));
}

// A compact, universally-useful core the coach can always draw on.
export const CORE_PRACTICE_IDS = ["sleep", "exercise", "interoception", "implementation"];
export function corePractices(): KeystonePractice[] {
  return CORE_PRACTICE_IDS
    .map((id) => KEYSTONE_PRACTICES.find((p) => p.id === id))
    .filter((p): p is KeystonePractice => !!p);
}
