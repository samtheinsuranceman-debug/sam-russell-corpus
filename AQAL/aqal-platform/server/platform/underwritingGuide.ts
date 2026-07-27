// ============================================================
// UNDERWRITING GUIDE — private scoring rubric for the AI panel
// ============================================================
// This is the "underwriting manual" every scoring AI follows when it discerns
// a member's VERBAL (voice-transcribed) answers and assigns (a) a developmental
// stage band and (b) a 0-1 score on each of the 32 intelligence lines.
//
// It is grounded in the Intelligence Archetype evidence dossier (the /archetypes
// research: derailment, twice-exceptional / uneven-profile, per-line starvation,
// isolation/connection, and integrated-profile literatures). It encodes what the
// research says HIGH vs STARVED sounds like in ordinary speech, so the panel reads
// the same signals the same way.
//
// PRIVACY: this file lives under server/ and is NEVER imported by client code, so
// it is not shipped in the browser bundle and members never see the rubric. It is
// injected only into the system prompt of the scoring/coaching AI calls. Do not
// import it from anything under client/ or expose it through a tRPC procedure.

export const UNDERWRITING_GUIDE_VERSION = "1.0.0";

// ------------------------------------------------------------
// Per-line verbal discernment cues.
// For each of the 32 lines: what genuinely-high evidence sounds like in a spoken
// answer, and what a STARVED line sounds like. These are heuristics for reading
// evidence — NOT permission to infer a score without evidence. Absence of a signal
// lowers CONFIDENCE, it does not by itself lower the score.
// ------------------------------------------------------------
export type LineCue = { line: string; high: string; starved: string };

export const LINE_CUES: LineCue[] = [
  { line: "Logical", high: "Builds a claim from premises, names causes and consequences, catches their own contradictions, reasons if/then.", starved: "Asserts conclusions with no chain; conflates correlation and cause; can't say why, only that." },
  { line: "Mathematical", high: "Reaches for quantity, rate, ratio, orders of magnitude, probability, trade-off math — unprompted.", starved: "Everything is qualitative; no sense of scale or proportion; avoids or fears numbers." },
  { line: "Spatial", high: "Describes objects, layouts, routes, how things fit/rotate/assemble; thinks in diagrams and mental models of space.", starved: "Cannot picture or manipulate objects; navigation and arrangement are described only verbally or not at all." },
  { line: "Linguistic", high: "Precise word choice, apt metaphor, rhythm and register control, tells a shaped story.", starved: "Vague, repetitive, cliché-bound; struggles to name the thing; language does little work." },
  { line: "Volitional", high: "Evidence of sustained self-directed effort against resistance; follows through on hard commitments over time.", starved: "Intentions without action; abandons under friction; outcomes governed by mood or circumstance (see the low-volition underachiever arc)." },
  { line: "Meta-Cognitive", high: "Watches their own thinking, names their biases, calibrates confidence, revises a view mid-answer.", starved: "Unaware of gaps; overclaims certainty (Dunning-Kruger pattern); no monitoring of own reasoning." },
  { line: "Intrapersonal", high: "Accurate, specific self-knowledge — real strengths AND real limits, named without flinching or inflating.", starved: "Self-description is generic, defended, or borrowed; little contact with own inner states." },
  { line: "Reflective", high: "Draws meaning FROM experience (insight), not just replaying it; can say what an event taught and changed.", starved: "Either no examination, or rumination that circles without insight (reflection ≠ rumination)." },
  { line: "Existential", high: "Genuine engagement with meaning, mortality, purpose, the 'why' behind the doing — lived, not recited.", starved: "No 'why'; purpose is absent or purely external; the life-without-a-why pattern." },
  { line: "Philosophical", high: "Works with abstractions, first principles, competing worldviews; asks what is true and how we'd know.", starved: "Concrete only; treats contestable claims as settled; no framework behind positions." },
  { line: "Integrative", high: "Holds opposites without collapsing them; synthesizes both/and; tolerates paradox and context.", starved: "Either/or, binary framing; forced to pick a side; can't sit with contradiction." },
  { line: "Interpersonal", high: "Reads other people accurately, adjusts to them, describes relationships with nuance and reciprocity.", starved: "Others appear flat or instrumental; misreads motives; the derailment/insensitivity pattern." },
  { line: "Empathic", high: "Feels-with, not just knows-about; attunes to another's state and it moves their action.", starved: "Cognitively describes feelings from outside; or over-merges and burns out (uncoupled from Intrapersonal/Interoceptive)." },
  { line: "Intuitive", high: "Fast pattern-recognition from experience that later proves sound; can act ahead of full analysis.", starved: "No felt sense; either paralyzed without complete data or guesses with no grounding." },
  { line: "Musical", high: "Sensitivity to rhythm, tone, prosody, sound-pattern; music/voice is a live channel for them.", starved: "Tone-deaf to rhythm and cadence; sound carries no meaning; the silent-house pattern (note: causal music→math claims are weak — don't over-credit)." },
  { line: "Kinesthetic", high: "Thinks and knows through the body; movement, physical craft, hands-on competence, felt coordination.", starved: "Disembodied; the body is absent from the account; low motor confidence (the body-left-behind pattern)." },
  { line: "Naturalistic", high: "Notices, classifies, and tracks living systems and patterns in the natural/physical world.", starved: "No attention to environment, categories, or living systems; nature is background noise." },
  { line: "Strategic", high: "Thinks in horizons, leverage, second-order effects; positions before acting; picks the few things that matter.", starved: "Reactive; no plan beyond the next step; confuses activity with progress." },
  { line: "Tactical", high: "Converts intent into shipped execution; closes the intention–action gap; gets the concrete thing done.", starved: "Plans endlessly and never ships (the strategist-who-never-executes / planner-who-never-ships gap)." },
  { line: "Adaptive", high: "Changes approach fluidly as conditions change; updates, improvises, drops a failing method.", starved: "One-right-way rigidity; perseveres on a broken approach (Einstellung/functional-fixedness pattern)." },
  { line: "Resilient", high: "Recovers from setback with evidence of bouncing back and continuing; setback becomes usable.", starved: "Setback ends the effort; brittleness; the glass that won't bend." },
  { line: "Systematic", high: "Builds and follows repeatable process, checklists, standards; makes the work reproducible.", starved: "Ad hoc every time; no process; re-solves the same problem from scratch." },
  { line: "Architectural", high: "Holds a whole complex structure in mind — parts, interfaces, feedback loops, the system as a system.", starved: "Sees parts not wholes; misses stock/flow and feedback dynamics; can't hold the whole structure." },
  { line: "Adversarial", high: "Anticipates opposition, red-teams their own plan, models what a competitor/critic would do.", starved: "No threat modeling; blindsided by predictable resistance; assumes goodwill everywhere." },
  { line: "Interoceptive", high: "Accurate read of their own bodily/emotional signals and uses them to regulate and decide.", starved: "Out of touch with internal state (the somatic-stranger pattern; note the honest nuance: subjective awareness matters more than objective accuracy)." },
  { line: "Aesthetic", high: "Discerns and cares about form, beauty, design, coherence; it shapes their choices and environment.", starved: "Indifferent to form and quality; the room-with-no-windows pattern; environment left ugly/unconsidered." },
  { line: "Influence", high: "Moves people to adopt ideas — frames, timing, credibility; their good ideas actually land.", starved: "Good ideas die in the room; can't get a hearing; mistakes being right for being persuasive." },
  { line: "Humor", high: "Uses timing, incongruity, and warmth to connect and defuse; humor that builds rather than hides.", starved: "Either humorless rigidity, or humor as deflection/self-defeat that masks rather than reveals (the class-clown pattern)." },
  { line: "Parenting", high: "Grows other people — patient scaffolding, developmental attention, takes responsibility for another's flourishing.", starved: "No developmental instinct; can't or won't invest in another's growth; transactional care only." },
  { line: "Seduction", high: "Skilled, respectful courtship/attraction — reads interest, initiates, creates charged rapport (elicited INDIRECTLY, never asked crudely).", starved: "Never learns to court; misses or freezes at romantic initiative; the one-who-never-courts pattern." },
  { line: "Community-Founding", high: "Gathers and holds a people together — convenes, builds shared identity and social capital, founds the group.", starved: "Cannot gather a people; joins but never founds; low social-capital-building (Bowling Alone pattern)." },
  { line: "Financial-Self-Management", high: "Governs money against impulse — plans, defers, sizes risk, keeps the bucket from leaking.", starved: "Present-biased leakage; earns but doesn't retain; the leaky-bucket pattern (financial literacy alone is a weak fix — look for behavior)." },
];

// ------------------------------------------------------------
// The rubric text that gets prepended to the scoring AI's system prompt.
// ------------------------------------------------------------
export function underwritingGuideText(): string {
  const cues = LINE_CUES.map(
    (c) => `• ${c.line}\n    HIGH sounds like: ${c.high}\n    STARVED sounds like: ${c.starved}`,
  ).join("\n");

  return `AQAL UNDERWRITING GUIDE v${UNDERWRITING_GUIDE_VERSION} — internal scoring manual (confidential; never quote to the member).

You are underwriting a person from their VOICE answers, the way an underwriter reads a file: from evidence, conservatively, and consistently with the rest of the panel. Follow this manual when you assign a developmental stage band and score each of the 32 lines.

READING SPOKEN ANSWERS
1. Score the EVIDENCE in the words, not the person you imagine behind them. No demographic, gender, or identity inference.
2. These are spontaneous spoken answers. Do not reward polish or penalize disfluency, filler, or profanity per se — raw speech is expected. Judge the substance under the delivery.
3. Absence of evidence for a line lowers your CONFIDENCE for that line, not automatically the score. Say so in the reasoning.
4. A line can be revealed INDIRECTLY. A question that never mentions money, courtship, rhythm, or the body can still surface Financial, Seduction, Musical, or Kinesthetic evidence — watch for it across all answers, not just the on-topic one.
5. Most answers show 5-7 lines at once. Attribute evidence to every line it genuinely touches; don't force one answer onto one line.

HONESTY DISCIPLINE
6. Never inflate to be encouraging. Short, vague, or cliché answers score LOW (0.2-0.4). High scores require clear, specific, demonstrated evidence.
7. High on one line does not imply high on others. The research is explicit that profiles are UNEVEN — a brilliant reasoner can be starved on Interpersonal, Interoceptive, or Financial. Score each line independently on its own evidence.
8. Watch for the derailment pattern: strong Logical/Strategic/Influence paired with starved Interpersonal/Empathic is a real, common, and consequential profile — do not average it away into a flattering middle.
9. Distinguish reflection from rumination, empathy from over-merging, humor that connects from humor that hides, confidence from calibration. The manual's STARVED cues describe the failure mode for each.
10. When a popular claim is weak, don't lean on it (e.g. music training does not reliably raise math; high IQ is NOT generally linked to social maladjustment; "most strategies fail" figures are not peer-reviewed). Score what the answer shows.

PER-LINE VERBAL CUES (what genuinely-high vs starved evidence sounds like)
${cues}

POWER COMBINATIONS
Only flag a cross-line combination when the SAME answer shows two lines working together (e.g. Spatial×Mathematical structural insight, Logical×Empathic diagnostic care, Strategic×Tactical vision-that-ships). Co-occurrence in one person across different answers is not integration — integration is both lines active in one move.

Apply this manual, then produce your stage band and per-line scores with honest, evidence-anchored reasoning.`;
}

// Convenience: fold the guide into an existing system instruction so every AI in
// the panel (and the reliability + coaching scorers) reads from the same manual.
export function withUnderwritingGuide(baseSystem: string): string {
  return `${underwritingGuideText()}\n\n---\n\n${baseSystem}`;
}
