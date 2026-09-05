// ============================================================
// RESEARCH PROVENANCE SEED — the 32 lines mapped to the published
// bodies of literature that ground them (L1-10 / AQAL Sovereign).
//
// HONESTY RULES APPLIED:
// - Every entry names a REAL research tradition and real scholars.
// - doi is null on every row — DOIs are never invented here; specific
//   paper DOIs can be added later from the verified research catalog.
// - peerReviewed=true means the named tradition rests on peer-reviewed
//   literature, not that this row cites one specific vetted paper.
// Seeding is idempotent (upsert by axisIndex).
// ============================================================
import { ALL_AXES } from "../../shared/axisModes";

export type ProvenanceSeed = { axisIndex: number; theoryName: string; authors: string[]; doi: string | null; peerReviewed: boolean };

const THEORY: Record<string, { theoryName: string; authors: string[] }> = {
  "Logical":                  { theoryName: "Fluid reasoning (Gf), Cattell–Horn–Carroll theory", authors: ["R. Cattell", "J. Horn", "J. Carroll"] },
  "Mathematical":             { theoryName: "Quantitative knowledge (Gq), CHC theory", authors: ["J. Carroll", "K. McGrew"] },
  "Spatial":                  { theoryName: "Visuospatial processing (Gv); mental rotation research", authors: ["R. Shepard", "J. Metzler", "M. Hegarty"] },
  "Linguistic":               { theoryName: "Verbal-crystallized ability (Gc); linguistic intelligence", authors: ["J. Carroll", "H. Gardner"] },
  "Volitional":               { theoryName: "Self-regulation and grit research", authors: ["R. Baumeister", "A. Duckworth"] },
  "Meta-Cognitive":           { theoryName: "Metacognition and metamemory research", authors: ["J. Flavell", "J. Dunlosky", "J. Metcalfe"] },
  "Intrapersonal":            { theoryName: "Intrapersonal intelligence; self-knowledge research", authors: ["H. Gardner", "H. Markus"] },
  "Reflective":               { theoryName: "Reflective judgment model", authors: ["P. King", "K. Kitchener"] },
  "Existential":              { theoryName: "Existential intelligence (candidate); meaning-in-life research", authors: ["H. Gardner", "M. Steger"] },
  "Philosophical":            { theoryName: "Epistemic cognition; intellectual development schemes", authors: ["D. Kuhn", "W. Perry"] },
  "Integrative":              { theoryName: "Integrative complexity research", authors: ["P. Suedfeld", "P. Tetlock"] },
  "Interpersonal":            { theoryName: "Interpersonal/social intelligence research", authors: ["H. Gardner", "E. Thorndike", "J. Kihlstrom", "N. Cantor"] },
  "Empathic":                 { theoryName: "Multidimensional empathy research (IRI); empathizing", authors: ["M. Davis", "S. Baron-Cohen"] },
  "Intuitive":                { theoryName: "Dual-process cognition; conditions for skilled intuition", authors: ["D. Kahneman", "G. Klein"] },
  "Musical":                  { theoryName: "Musical intelligence; audiation research", authors: ["H. Gardner", "E. Gordon"] },
  "Kinesthetic":              { theoryName: "Bodily-kinesthetic intelligence; motor expertise research", authors: ["H. Gardner", "K. A. Ericsson"] },
  "Naturalistic":             { theoryName: "Naturalist intelligence", authors: ["H. Gardner"] },
  "Strategic":                { theoryName: "Planning/executive function; expert strategic thought", authors: ["A. Miyake", "A. de Groot"] },
  "Tactical":                 { theoryName: "Situation awareness; naturalistic decision making", authors: ["M. Endsley", "G. Klein"] },
  "Adaptive":                 { theoryName: "Cognitive flexibility within executive functions", authors: ["A. Diamond"] },
  "Resilient":                { theoryName: "Psychological resilience research", authors: ["A. Masten", "G. Bonanno"] },
  "Systematic":               { theoryName: "Systemizing; systems-thinking research", authors: ["S. Baron-Cohen", "L. B. Sweeney", "J. Sterman"] },
  "Architectural":            { theoryName: "Design cognition; sciences of the artificial", authors: ["H. Simon", "N. Cross"] },
  "Adversarial":              { theoryName: "Strategic interaction and game-theoretic cognition", authors: ["T. Schelling", "J. von Neumann", "O. Morgenstern"] },
  "Interoceptive":            { theoryName: "Interoception and interoceptive accuracy research", authors: ["A. D. Craig", "S. Garfinkel", "H. Critchley"] },
  "Aesthetic":                { theoryName: "Empirical aesthetics; aesthetic sensitivity research", authors: ["D. Berlyne", "H. Leder"] },
  "Influence":                { theoryName: "Persuasion and social influence research", authors: ["R. Cialdini", "R. Petty", "J. Cacioppo"] },
  "Humor":                    { theoryName: "Humor production ability research", authors: ["A. Feingold", "G. Greengross", "G. Miller"] },
  "Parenting":                { theoryName: "Parenting styles and parenting competence research", authors: ["D. Baumrind", "M. Bornstein"] },
  "Seduction":                { theoryName: "Interpersonal attraction; charisma signaling research", authors: ["D. Buss", "J. Antonakis"] },
  "Community-Founding":       { theoryName: "Collective action and commons governance; venture emergence", authors: ["E. Ostrom", "W. Gartner"] },
  "Financial-Self-Management":{ theoryName: "Financial literacy and capability research", authors: ["A. Lusardi", "O. Mitchell"] },
};

export const PROVENANCE_SEED: ProvenanceSeed[] = ALL_AXES.map((name, axisIndex) => {
  const t = THEORY[name];
  if (!t) throw new Error(`No provenance seed for axis "${name}"`);
  return { axisIndex, theoryName: t.theoryName, authors: t.authors, doi: null, peerReviewed: true };
});

/** Idempotent seed: upsert all 32 rows. Safe to run at every boot. */
export async function seedProvenance(): Promise<number> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return 0;
  const { researchProvenance } = await import("../../drizzle/schema");
  let n = 0;
  for (const row of PROVENANCE_SEED) {
    try {
      await db.insert(researchProvenance)
        .values({ axisIndex: row.axisIndex, theoryName: row.theoryName, authors: row.authors, doi: row.doi, peerReviewed: row.peerReviewed })
        .onDuplicateKeyUpdate({ set: { theoryName: row.theoryName, authors: row.authors, peerReviewed: row.peerReviewed } });
      n++;
    } catch (e) {
      console.warn("[provenance] seed failed for axis", row.axisIndex, String(e).slice(0, 120));
    }
  }
  return n;
}
