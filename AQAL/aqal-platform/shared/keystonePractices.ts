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

  // ─── Money & wealth behavior ────────────────────────────────────────────────
  {
    id: "auto-savings", name: "Automate & escalate saving", section: "Financial Wellbeing & Behavior", librarySection: "Financial Wellbeing & Behavior",
    evidence: "Strong", lifts: ["financial-self-management", "volitional"],
    prescription: "Automate a fixed transfer to savings/investing on payday and pre-commit to escalate it with every raise (the 'Save More Tomorrow' design) so the choice happens once, not monthly.",
    horizon: "set up once; compounds for years",
    researchBasis: "Automatic enrollment and Save-More-Tomorrow escalation dramatically raised real savings rates in field studies by defaulting people into the behavior.",
    goalKeywords: ["money", "save", "savings", "wealth", "retirement", "financial", "rich", "debt", "budget"],
  },
  {
    id: "index-investing", name: "Low-cost index investing", section: "Financial Wellbeing & Behavior", librarySection: "Financial Wellbeing & Behavior",
    evidence: "Strong", lifts: ["financial-self-management", "logical"],
    prescription: "Default to broad, low-fee index funds and hold — most active managers underperform the index net of fees over time, and fees compound against you.",
    horizon: "years to decades",
    researchBasis: "SPIVA and related data show the large majority of active funds underperform their benchmark net of fees over 10–15 year windows.",
    goalKeywords: ["invest", "investing", "wealth", "money", "retirement", "rich", "financial", "portfolio", "stocks"],
  },
  {
    id: "commitment-device", name: "Commitment devices & pre-commitment", section: "Financial Wellbeing & Behavior", librarySection: "Behavior-Change & Psychological Interventions",
    evidence: "Strong", lifts: ["volitional", "financial-self-management"],
    prescription: "Lock your future self in advance — a commitment savings account, a locked deadline, a stake you forfeit if you slip — so willpower isn't required at the moment of temptation.",
    horizon: "set up now; protects every future decision",
    researchBasis: "Commitment savings accounts (e.g. the SEED trial) and pre-commitment devices meaningfully raised follow-through by removing the in-the-moment choice.",
    goalKeywords: ["discipline", "save", "quit", "habit", "temptation", "money", "goal", "willpower", "consistency"],
  },

  // ─── Career, skill & learning ───────────────────────────────────────────────
  {
    id: "deliberate-practice", name: "Deliberate practice", section: "Learning Science & Cognition", librarySection: "Learning Science & Cognition",
    evidence: "Moderate", lifts: ["mastery", "strategic", "volitional"],
    prescription: "Practice at the edge of your ability on the specific sub-skills you're worst at, with immediate feedback and full focus — not comfortable repetition of what you already do well.",
    horizon: "months to years for real mastery",
    researchBasis: "Deliberate practice — focused, feedback-rich reps at the edge of ability — predicts skill gains, though its share of the variance varies by domain (honest: it's a lever, not the whole story).",
    goalKeywords: ["skill", "master", "career", "expert", "improve", "learn", "craft", "business", "performance", "practice"],
  },
  {
    id: "spaced-retrieval", name: "Spaced repetition + retrieval practice", section: "Learning Science & Cognition", librarySection: "Learning Science & Cognition",
    evidence: "Strong", lifts: ["linguistic", "logical", "memory"],
    prescription: "Learn by testing yourself and spacing the reviews out (not rereading) — retrieval and distributed practice are the two best-replicated ways to make knowledge stick.",
    horizon: "weeks; durable for months+",
    researchBasis: "The testing effect and distributed practice are among the most robust findings in learning science, repeatedly beating rereading for long-term retention.",
    goalKeywords: ["learn", "study", "language", "exam", "skill", "memory", "knowledge", "master", "school", "certification"],
  },
  {
    id: "deep-work", name: "Deep-work attention blocks", section: "Digital Life, Attention & Wellbeing", librarySection: "Digital Life, Attention & Wellbeing",
    evidence: "Emerging", lifts: ["strategic", "volitional", "attention"],
    prescription: "Protect uninterrupted single-task blocks with the phone out of the room — task-switching carries a real resumption cost, so batching focus beats reacting all day.",
    horizon: "daily; compounds over weeks",
    researchBasis: "Interruption and task-switching research shows measurable resumption-lag costs; the specific 'deep work' protocol is popular but more lightly trialed (honest: Emerging).",
    goalKeywords: ["focus", "productivity", "work", "distraction", "deep", "attention", "procrastination", "output", "writing"],
  },

  // ─── Mood, anxiety & mental health ──────────────────────────────────────────
  {
    id: "behavioral-activation", name: "Behavioral activation", section: "Trauma & Mental-Health Treatments", librarySection: "Trauma & Mental-Health Treatments",
    evidence: "Strong", lifts: ["volitional", "mood", "self-regulation"],
    prescription: "Schedule small valued or rewarding actions and do them regardless of motivation — action precedes mood here, not the other way around.",
    horizon: "2–6 weeks to shift mood",
    researchBasis: "Behavioral activation is a first-line, evidence-based treatment for depression, roughly as effective as full CBT in trials.",
    goalKeywords: ["depression", "mood", "motivation", "low", "sad", "stuck", "energy", "anhedonia", "rut"],
  },
  {
    id: "cbt-restructuring", name: "Cognitive restructuring (CBT skills)", section: "Trauma & Mental-Health Treatments", librarySection: "Trauma & Mental-Health Treatments",
    evidence: "Strong", lifts: ["meta-cognitive", "emotion", "intrapersonal"],
    prescription: "Catch the automatic thought, write it down, and test it against the evidence — the core CBT move that loosens anxious and depressive thinking loops.",
    horizon: "weeks of practice",
    researchBasis: "CBT is one of the most strongly evidenced psychotherapies for anxiety and depression across hundreds of trials.",
    goalKeywords: ["anxiety", "worry", "negative", "mood", "depression", "stress", "confidence", "self-talk", "overthinking"],
  },

  // ─── Strength, body & nutrition ─────────────────────────────────────────────
  {
    id: "resistance-training", name: "Resistance training", section: "Exercise Physiology Specifics", librarySection: "Exercise Physiology Specifics",
    evidence: "Strong", lifts: ["kinesthetic", "resilient", "mood"],
    prescription: "Progressive strength training 2–3×/week — it builds muscle and bone, lowers all-cause mortality risk, and has a real antidepressant effect on its own.",
    horizon: "6–12 weeks for strength & mood gains",
    researchBasis: "Meta-analyses link resistance training to lower all-cause mortality and a moderate reduction in depressive symptoms independent of aerobic exercise.",
    goalKeywords: ["strength", "muscle", "fitness", "body", "health", "aging", "mood", "energy", "gym", "weight"],
  },
  {
    id: "protein-fiber", name: "Protein + fiber baseline", section: "Nutrition & Supplements (Graded)", librarySection: "Nutrition & Supplements (Graded)",
    evidence: "Strong", lifts: ["health", "energy"],
    prescription: "Anchor meals around adequate protein and high fiber — the two dietary levers with the strongest, least-hyped evidence for satiety, muscle, and long-term health.",
    horizon: "weeks for satiety/energy; years for health",
    researchBasis: "Higher dietary fiber shows a strong dose-response link to lower all-cause mortality; adequate protein supports muscle retention and satiety.",
    goalKeywords: ["weight", "muscle", "health", "energy", "diet", "nutrition", "gut", "fat loss", "fitness"],
  },

  // ─── Connection, purpose & positive psychology ──────────────────────────────
  {
    id: "social-connection", name: "Invest in social connection", section: "Social Connection, Purpose & Longevity", librarySection: "Social Connection, Purpose & Longevity",
    evidence: "Strong", lifts: ["interpersonal", "empathic", "resilient"],
    prescription: "Protect regular, real, face-to-face contact with people you care about — social connection is one of the strongest predictors of health and longevity there is.",
    horizon: "ongoing; effects build over years",
    researchBasis: "Holt-Lunstad's meta-analyses put weak social connection on par with well-known mortality risks like smoking (honest: observational, but very robust).",
    goalKeywords: ["lonely", "friends", "connection", "relationship", "community", "belonging", "isolation", "social", "health"],
  },
  {
    id: "purpose", name: "Anchor a sense of purpose", section: "Social Connection, Purpose & Longevity", librarySection: "Social Connection, Purpose & Longevity",
    evidence: "Moderate", lifts: ["existential", "volitional", "intrapersonal"],
    prescription: "Name a purpose bigger than yourself and put one concrete weekly action behind it — a stronger sense of purpose tracks with better health and longevity.",
    horizon: "ongoing",
    researchBasis: "Cohort studies associate a stronger sense of purpose/ikigai with lower mortality and better health (honest: observational, confounding possible).",
    goalKeywords: ["purpose", "meaning", "direction", "lost", "motivation", "legacy", "why", "fulfillment"],
  },
  {
    id: "gratitude-kindness", name: "Gratitude & prosocial action", section: "Meaning, Grief & Positive Psychology", librarySection: "Meaning, Grief & Positive Psychology",
    evidence: "Moderate", lifts: ["intrapersonal", "empathic", "mood"],
    prescription: "A brief weekly gratitude reflection plus regular small acts of help — modest but real lifts to wellbeing, and cheap to run.",
    horizon: "weeks; keep it periodic, not daily-forced",
    researchBasis: "Gratitude and kindness interventions produce small-to-moderate wellbeing gains (honest: effect sizes are modest and sensitive to how they're run).",
    goalKeywords: ["happiness", "wellbeing", "gratitude", "meaning", "giving", "positivity", "mood", "content"],
  },
  {
    id: "expressive-writing", name: "Expressive writing", section: "Meaning, Grief & Positive Psychology", librarySection: "Meaning, Grief & Positive Psychology",
    evidence: "Moderate", lifts: ["reflective", "emotion", "intrapersonal"],
    prescription: "Write continuously about a stressor for ~15 minutes across a few days — the Pennebaker paradigm helps many people process and get clarity.",
    horizon: "3–4 short sessions",
    researchBasis: "Expressive writing produces modest but replicated improvements in processing stressful experiences and some health markers.",
    goalKeywords: ["stress", "processing", "emotion", "writing", "clarity", "grief", "closure", "overwhelm"],
  },

  // ─── Volition & regulation extras ───────────────────────────────────────────
  {
    id: "woop", name: "WOOP / mental contrasting", section: "Behavior-Change & Psychological Interventions", librarySection: "Behavior-Change & Psychological Interventions",
    evidence: "Strong", lifts: ["volitional", "strategic", "meta-cognitive"],
    prescription: "Run every goal through WOOP — Wish, Outcome, Obstacle, Plan — pairing the vision with the concrete obstacle and an if-then plan for it, which beats visualizing success alone.",
    horizon: "minutes to set up per goal",
    researchBasis: "Mental contrasting with implementation intentions (WOOP) outperforms indulging in positive fantasy alone for actual goal attainment across trials.",
    goalKeywords: ["goal", "motivation", "habit", "discipline", "procrastination", "change", "plan", "obstacle", "follow-through"],
  },
  {
    id: "morning-light", name: "Morning light + circadian anchoring", section: "Sleep & Circadian Interventions", librarySection: "Sleep & Circadian Interventions",
    evidence: "Strong", lifts: ["mood", "sleep", "energy"],
    prescription: "Get bright light early and keep sleep-wake timing consistent — the cheapest lever for stabilizing circadian rhythm, mood, and daytime energy.",
    horizon: "days to a couple of weeks",
    researchBasis: "Morning bright-light exposure and regular timing reliably phase-anchor circadian rhythm and improve mood and alertness.",
    goalKeywords: ["sleep", "energy", "mood", "circadian", "focus", "morning", "jetlag", "tired", "routine"],
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

// The keystone practice that most directly bolsters a given 32-line name, if one
// exists. Matches on the lowercased line token in a practice's `lifts` (the lifts
// use canonical line tokens like "interoceptive" / "financial-self-management"),
// so it returns a genuine match or nothing — never a forced/irrelevant practice.
export function keystoneForLine(line: string): KeystonePractice | undefined {
  const token = (line || "").toLowerCase().trim();
  if (!token) return undefined;
  return KEYSTONE_PRACTICES.find((p) => p.lifts.some((l) => l.toLowerCase() === token));
}

// A compact, universally-useful core the coach can always draw on.
export const CORE_PRACTICE_IDS = ["sleep", "exercise", "interoception", "implementation"];
export function corePractices(): KeystonePractice[] {
  return CORE_PRACTICE_IDS
    .map((id) => KEYSTONE_PRACTICES.find((p) => p.id === id))
    .filter((p): p is KeystonePractice => !!p);
}
