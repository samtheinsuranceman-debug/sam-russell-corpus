// ============================================================
// Keystone practices — the prescribable menu behind the coaching
// ============================================================
// Every entry is a research-backed practice that lives in the Research Library
// (see section numbers). The outcome-engineering coach draws prescribed moves
// from THIS menu so its advice is specific, cited, and honest — not generic.
// `goalKeywords` let us surface the right practices for a person's stated goals
// (e.g. "marriage" → the couples practices). `evidence` mirrors the library's tier.

export type KeystonePractice = {
  id: string;
  name: string;
  section: string;        // Research Library section number
  librarySection: string; // display label (the "read this" topic)
  evidence: "Strong" | "Moderate" | "Emerging";
  lifts: string[];        // lines / clusters it bolsters
  prescription: string;   // the concrete, honest "do this"
  goalKeywords: string[]; // words in a person's stated goals that make it relevant
};

export const KEYSTONE_PRACTICES: KeystonePractice[] = [
  // ─── Universal meta-systems (relevant to almost any goal) ───────────────────
  {
    id: "sleep", name: "Sleep protection", section: "14", librarySection: "Sleep — The Foundational System",
    evidence: "Strong", lifts: ["memory", "emotion", "decision-making", "self-regulation"],
    prescription: "Protect 7–9h with regular timing — the single highest-leverage move, because sleep gates every other line.",
    goalKeywords: ["focus", "energy", "health", "performance", "stress", "burnout", "memory", "productivity", "discipline"],
  },
  {
    id: "exercise", name: "Aerobic exercise", section: "13", librarySection: "Aerobic Exercise — The Proven Keystone",
    evidence: "Strong", lifts: ["cognition", "memory", "mood", "resilience", "self-regulation"],
    prescription: "Regular aerobic training (the best-evidenced brain intervention) to lift cognition, mood, and resilience together.",
    goalKeywords: ["focus", "energy", "health", "mood", "memory", "performance", "depression", "discipline", "productivity", "fitness"],
  },
  {
    id: "interoception", name: "Interoception / floatation practice", section: "12", librarySection: "Interoception — The Cross-Line Keystone",
    evidence: "Moderate", lifts: ["interoceptive", "empathic", "intrapersonal", "decision-making"],
    prescription: "Train interoception (breath/body attention, or floatation) — one practice that plausibly lifts self-regulation, empathy, and intuition via the shared insula hub.",
    goalKeywords: ["emotion", "anxiety", "intuition", "self-awareness", "calm", "stress", "regulation", "empathy", "mindfulness"],
  },
  {
    id: "breathwork", name: "Breathwork / HRV", section: "15", librarySection: "Breathwork & HRV — Autonomic Self-Regulation",
    evidence: "Moderate", lifts: ["self-regulation", "attention", "emotion"],
    prescription: "Brief daily slow-breathing (e.g. cyclic sighing) to raise vagal tone and improve emotional control and focus.",
    goalKeywords: ["stress", "anxiety", "focus", "calm", "regulation", "emotion", "burnout", "performance"],
  },
  {
    id: "nature", name: "Nature exposure", section: "16", librarySection: "Nature Exposure — Attention Restoration",
    evidence: "Moderate", lifts: ["attention", "mood", "creativity"],
    prescription: "~2 hours/week in natural settings to restore attention, lower rumination, and lift mood — passive and low-effort.",
    goalKeywords: ["stress", "creativity", "focus", "mood", "rumination", "burnout", "wellbeing"],
  },
  {
    id: "thermal", name: "Thermal stress (sauna)", section: "17", librarySection: "Thermal Stress — Sauna & Cold",
    evidence: "Moderate", lifts: ["resilience", "mood", "healthspan"],
    prescription: "Regular sauna use (strong cohort evidence for brain and cardiovascular healthspan); cold exposure is real acute but over-hyped for durable gains.",
    goalKeywords: ["resilience", "health", "longevity", "stress", "mood", "fitness"],
  },
  {
    id: "psychedelic", name: "Psychedelic-assisted therapy (documented, not prescribed)", section: "18", librarySection: "Psychedelic-Assisted Therapy — Deep but Gated",
    evidence: "Emerging", lifts: ["openness", "meaning", "mood"],
    prescription: "Documented for durable openness and mood change under strict medical supervision — we DOCUMENT this, we do not prescribe it. Legal, screening, and safety constraints apply.",
    goalKeywords: ["meaning", "openness", "depression", "transformation", "purpose"],
  },

  // ─── Social / relational lines ──────────────────────────────────────────────
  {
    id: "nonverbal", name: "Nonverbal-decoding practice", section: "19", librarySection: "Reading People — Nonverbal Decoding",
    evidence: "Moderate", lifts: ["interpersonal", "empathic", "intuitive"],
    prescription: "Deliberate emotion-reading practice (validated to improve nonverbal decoding). Watching muted interaction is a plausible but UNTESTED exercise — try it, don't bank on it.",
    goalKeywords: ["relationship", "social", "leadership", "sales", "team", "communication", "dating", "negotiation", "influence"],
  },

  // ─── Couples / marriage / parenting (the abundant relational set) ────────────
  {
    id: "relationship-media", name: "Watch + discuss relationship media", section: "20", librarySection: "Couples, Relationships & Parenting",
    evidence: "Strong", lifts: ["marital", "empathic", "interpersonal"],
    prescription: "With your partner, WATCH and DISCUSS relationship films regularly (the Rogge protocol — halved the 3-year divorce rate; the discussion is the active ingredient).",
    goalKeywords: ["marriage", "spouse", "partner", "relationship", "divorce", "wife", "husband", "romance", "dating"],
  },
  {
    id: "empathy-training", name: "Empathy & perspective-taking practice", section: "20", librarySection: "Couples, Relationships & Parenting",
    evidence: "Moderate", lifts: ["empathic", "interpersonal"],
    prescription: "Structured perspective-taking practice (imagining the other's experience) — a meta-analysis of RCTs shows empathy is trainable; maintain it with repetition.",
    goalKeywords: ["relationship", "empathy", "conflict", "team", "parenting", "leadership", "marriage", "communication"],
  },
  {
    id: "relationship-education", name: "Communication & conflict skills", section: "20", librarySection: "Couples, Relationships & Parenting",
    evidence: "Moderate", lifts: ["marital", "interpersonal", "intrapersonal"],
    prescription: "Practice validated communication/conflict-management skills (speaker–listener, repair attempts) — relationship education lowers marital distress, especially with regular practice.",
    goalKeywords: ["marriage", "relationship", "communication", "conflict", "spouse", "partner"],
  },
  {
    id: "parenting", name: "Parenting-skill practice", section: "20", librarySection: "Couples, Relationships & Parenting",
    evidence: "Moderate", lifts: ["parental", "empathic", "intrapersonal"],
    prescription: "Practice the validated parenting components — warm-and-structured (authoritative) style, emotional communication, positive interaction — WITH your own child (practice beats concepts).",
    goalKeywords: ["parent", "child", "children", "kids", "family", "son", "daughter", "fatherhood", "motherhood"],
  },
];

// Practices whose goal-keywords appear in the person's stated goals.
export function practicesForGoals(goals: string): KeystonePractice[] {
  const g = (goals || "").toLowerCase();
  if (!g.trim()) return [];
  return KEYSTONE_PRACTICES.filter((p) => p.goalKeywords.some((k) => g.includes(k)));
}

// A compact, universally-useful core the coach can always draw on.
export const CORE_PRACTICE_IDS = ["sleep", "exercise", "interoception", "breathwork"];
export function corePractices(): KeystonePractice[] {
  return KEYSTONE_PRACTICES.filter((p) => CORE_PRACTICE_IDS.includes(p.id));
}
