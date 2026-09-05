// ============================================================
// AQAL STAGE-DEVELOPMENT FRAMEWORK — private underwriting rubric
// ============================================================
// Distilled from the AQAL Development Framework corpus (constructivist ego-
// development / postautonomous action-logic manual: Loevinger / Cook-Greuter /
// Torbert lineage). This is the "stage manual" the scoring AIs use to place each
// of the 32 intelligence lines on a developmental altitude and name the stage.
//
// The full source corpus is stored, private, at
//   server/platform/data/aqal-framework/master_document.md
// and read at runtime via loadFrameworkCorpus(). Because everything here lives
// under server/ (Vite's client root is client/), NONE of it is bundled into the
// browser or exposed to members. Do not import this from client/ or surface it
// through a tRPC procedure.
//
// Score bands are aligned to the platform's existing 0-1 developmental scale
// (Spiral bands already used by the scoring prompt), so a stage placement and a
// 0-1 line score are the same measurement expressed two ways.

export const STAGE_FRAMEWORK_VERSION = "1.0.0";

export type DevStage = {
  /** ego-development stage number, e.g. "3/4" */
  stage: string;
  /** ego-development name */
  name: string;
  /** Torbert leadership action-logic name */
  actionLogic: string;
  /** approximate Spiral-Dynamics color band */
  spiral: string;
  /** [lo, hi] on the platform's 0-1 line scale */
  band: [number, number];
  /** rough base rate — NOTE: figures come from Cook-Greuter / Rooke & Torbert
   *  convenience samples (largely managers/professionals), NOT a representative
   *  general population; the top stages rest on very small samples. */
  population: string;
  /** perspective-taking capacity */
  perspective: string;
  /** what this stage sounds/looks like in a spoken answer — underwriting cue */
  cue: string;
};

// Nine action logics, low → high, mapped onto the 0-1 scale used by the scorer.
export const STAGE_LADDER: DevStage[] = [
  {
    stage: "2", name: "Impulsive", actionLogic: "Impulsive", spiral: "Magenta/Purple",
    band: [0.05, 0.12], population: "≈0% of sampled adults (childhood stage; audit-corrected)", perspective: "1st person",
    cue: "Needs-on-demand, 'me/mine', crude good/bad dichotomies, no reflection; impulse governs action.",
  },
  {
    stage: "2/3", name: "Self-protective", actionLogic: "Opportunist", spiral: "Red",
    band: [0.12, 0.22], population: "~8%", perspective: "1st person",
    cue: "Wins/losses, dominance, blame-outward, get-away-with-it; others are competitors for goods and power.",
  },
  {
    stage: "3", name: "Conformist", actionLogic: "Diplomat", spiral: "Amber/Blue",
    band: [0.22, 0.33], population: "~12%", perspective: "2nd person",
    cue: "Belonging, loyalty, 'what we do', approval and appearances; self fused with the in-group; us-vs-them.",
  },
  {
    stage: "3/4", name: "Self-conscious", actionLogic: "Expert / Technician", spiral: "Amber→Orange",
    band: [0.33, 0.42], population: "~38% — the modal stage (Rooke & Torbert managers/professionals sample)", perspective: "3rd person (emerging)",
    cue: "Craft/technical mastery, right-way perfectionism, 'yes-but' one-upmanship, standards and being correct.",
  },
  {
    stage: "4", name: "Conscientious", actionLogic: "Achiever", spiral: "Orange",
    band: [0.42, 0.55], population: "~30% (Rooke & Torbert managers/professionals sample)", perspective: "3rd person (expanded)",
    cue: "Goals, causes, effectiveness, linear time, rational self-improvement, measurable results; the Western 'target' stage.",
  },
  {
    stage: "4/5", name: "Individualist", actionLogic: "Individualist", spiral: "Green",
    band: [0.55, 0.68], population: "~10%", perspective: "4th person",
    cue: "Context and relativism, process over outcome, distrust of convention, multiple viewpoints, 'it depends'.",
  },
  {
    stage: "5", name: "Autonomous", actionLogic: "Strategist", spiral: "Teal/Yellow",
    band: [0.68, 0.82], population: "~4%", perspective: "4th person (expanded)",
    cue: "Systems thinking across time and cultures, holds paradox, principled self-authorship, growth-of-self as aim, mature humor/altruism.",
  },
  {
    stage: "5/6", name: "Construct-aware", actionLogic: "Alchemist / Magician", spiral: "Turquoise",
    band: [0.82, 0.93], population: "<2%", perspective: "5th-to-nth person",
    cue: "Sees through the language/meaning-making habit itself, cross-paradigm, holds existential paradox, transformative and self-relativizing.",
  },
  {
    stage: "6", name: "Unitive", actionLogic: "Ironist", spiral: "Indigo/Coral",
    band: [0.93, 1.0], population: "<1%", perspective: "Global / unitive",
    cue: "Center beyond ego, non-controlling witnessing presence, non-separateness, effortless perspective-shift, grounded transpersonal action (not mere spiritual talk).",
  },
];

// The rubric text injected into the scoring AI's system prompt.
export function stageFrameworkText(): string {
  const rows = STAGE_LADDER.map(
    (s) =>
      `  ${s.band[0].toFixed(2)}-${s.band[1].toFixed(2)}  Stage ${s.stage} ${s.name} (${s.actionLogic}, ${s.spiral}; ${s.population}, ${s.perspective})\n      → ${s.cue}`,
  ).join("\n");

  return `AQAL STAGE-DEVELOPMENT FRAMEWORK v${STAGE_FRAMEWORK_VERSION} — developmental-altitude manual (confidential).

Every one of the 32 lines is scored for DEVELOPMENTAL STAGE (altitude), not just amount. A line's 0-1 score IS its stage placement on this ladder. Read the meaning-making complexity the answer demonstrates on that line, then place it:

${rows}

UNDERWRITING RULES FOR STAGE
1. Score each line at the altitude the WORDS demonstrate — the structure of the reasoning, not the topic or vocabulary. Big words at Achiever complexity are still Achiever.
2. A person is not one stage. Lines differ — someone can reason at Strategist on Strategic and at Conformist on Interpersonal. Place each line on its own.
3. Higher stages require MORE: greater diversity of theme, higher structural complexity, deeper insight across the whole answer — not a single lofty sentence. One profound line does not lift the protocol.
4. Postconventional (0.55+) requires genuine perspective-taking beyond personal achievement. Construct-aware (0.82+) requires seeing through one's own meaning-making. Unitive (0.93+) is almost never assigned and must show grounded, embodied non-separateness — never mere spiritual or philosophical talk.
5. Most adults answer at Stage 3/4-4 (Self-conscious / Achiever, ~0.33-0.55). Do not inflate. When evidence is thin, hold the score at the demonstrated altitude and lower your CONFIDENCE.
6. Name the stage in your reasoning (e.g. "Achiever/Stage 4 reasoning: goal-and-cause framing, linear time"). This is what makes the score defensible.`;
}

// ------------------------------------------------------------
// Full corpus access (private; server-side only).
// Any API-linked AI call site can pull the full manual for deep reference.
// Best-effort: returns null if the data file isn't present in the deploy.
// ------------------------------------------------------------
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const CORPUS_CANDIDATES = [
  path.resolve(process.cwd(), "server/platform/data/aqal-framework/master_document.md"),
  path.resolve(process.cwd(), "platform/data/aqal-framework/master_document.md"),
  path.resolve(process.cwd(), "data/aqal-framework/master_document.md"),
];

let _corpusCache: string | null | undefined;

/** Full AQAL framework corpus text, or null if unavailable. Cached after first read. */
export function loadFrameworkCorpus(): string | null {
  if (_corpusCache !== undefined) return _corpusCache;
  for (const p of CORPUS_CANDIDATES) {
    try {
      if (existsSync(p)) {
        _corpusCache = readFileSync(p, "utf-8");
        return _corpusCache;
      }
    } catch {
      // ignore and try next candidate
    }
  }
  _corpusCache = null;
  return _corpusCache;
}

/** Whether the full corpus file is reachable at runtime. */
export function frameworkCorpusAvailable(): boolean {
  return loadFrameworkCorpus() !== null;
}
