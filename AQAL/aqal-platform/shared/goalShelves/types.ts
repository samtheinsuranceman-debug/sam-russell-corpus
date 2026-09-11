// ============================================================
// AQAL — Research Library: GOAL SHELVES (sections 8000+)
// ============================================================
// The founder's brief: about twelve goals account for most of what members
// will actually name — a better marriage, better parenting, out of debt, be
// happy, a funded and meaningful retirement, start a business, a new hobby or
// skill, finish college and find the right career, find a partner, buy a home,
// travel, more time with family, a legacy, health/energy/beauty for as long as
// possible, and athletic performance. Each goal gets its own shelf of
// protocols: not "what is wrong with you" but "do this, at this level".
//
// Every cluster carries a TIER so the monthly coaching can hand a member a
// diverse menu for the goal they picked — one or two fundamental, one or two
// moderate, one or two advanced, one or two elite — and an ACTION, the
// concrete step, not a summary of a paper.
//
// Verification contract (the same as the longevity shelf, RESEARCH_PIPELINE.md):
//   • every source is a DOI resolved against the Crossref record, the
//     publisher page or the PubMed record on the date in each file's header;
//   • no Scholar fallbacks, `kind` is always "doi";
//   • unsupported or harmful advice is rated at the floor (impact magnitude 1
//     with a callout) so the library counts it as debunked;
//   • nothing on a shelf is medical, legal or financial advice.
// Structural twins of the Research Library's cluster types (client/src/pages/
// ResearchLibrary.tsx). They are repeated here so the server-side coach can
// read the shelves without importing the client bundle; TypeScript's
// structural typing keeps the two in step (the library test asserts it).
export type PracticeSource = { cite: string; note: string; link: string; kind: "doi" | "scholar" };
export type PracticeImpact = {
  magnitude: 1 | 2 | 3 | 4 | 5;
  latency: "days" | "weeks" | "months";
  durability: "transient" | "sustained" | "lasting";
  effort: "low" | "moderate" | "high";
};
export type PracticeHarm = {
  severity: 1 | 2 | 3 | 4 | 5;
  onset: "immediate" | "months" | "years";
  reversibility: "recovers" | "partial" | "lasting";
};
export type WeaknessProfile = {
  threat: number;
  weakLines: string[];
  degree: "primary driver" | "major contributor" | "moderate contributor";
  onset: "immediate" | "months" | "years";
  reversibility: "recovers" | "partial" | "lasting";
};
export type PracticeCluster = {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  description: string;
  evidenceTag: "Strong" | "Moderate" | "Emerging" | "Mixed";
  callout?: string;
  feeds?: string[];
  impact?: PracticeImpact;
  harm?: PracticeHarm;
  weakness?: WeaknessProfile;
  degrades?: string[];
  sources: PracticeSource[];
};

export type GoalTier = "fundamental" | "moderate" | "advanced" | "elite";
export const GOAL_TIERS: GoalTier[] = ["fundamental", "moderate", "advanced", "elite"];

export const TIER_LABEL: Record<GoalTier, string> = {
  fundamental: "Fundamental — free, daily, the floor everything else stands on",
  moderate: "Moderate — a structured program over weeks",
  advanced: "Advanced — expert-guided or a real investment of money and months",
  elite: "Elite / master — the highest-leverage move, rare and long-horizon",
};

// A book, video, course or tool that reinforces a protocol. Links are pages
// that were opened during verification (publisher, library record, official
// channel) — never guessed.
export type Reinforcement = {
  kind: "book" | "video" | "course" | "tool" | "site";
  title: string;
  by?: string;
  link?: string;
  note?: string;
};

export type GoalShelfCluster = PracticeCluster & {
  goal: GoalKey;
  tier: GoalTier;
  action: string;            // the concrete step, in the second person
  reinforcement?: Reinforcement[];
};

export type GoalKey =
  | "marriage"
  | "parenting"
  | "debt"
  | "happiness"
  | "retirement"
  | "business"
  | "hobby"
  | "education-career"
  | "partner"
  | "home"
  | "travel"
  | "family-time"
  | "legacy"
  | "health-energy-beauty"
  | "athlete";

export type GoalShelfMeta = {
  key: GoalKey;
  label: string;          // "Be a better husband, wife or partner"
  short: string;          // "Marriage"
  base: number;           // first section number (8000, 8100, …)
  extraBases: number[];   // further 100-section blocks the shelf may use (wave 3+: 10000, 10100, …)
  keywords: string[];     // words in a member's stated goal that select this shelf
};

/** Every 100-section block a shelf owns, in order. */
export const shelfBlocks = (m: GoalShelfMeta): number[] => [m.base, ...m.extraBases];
export const sectionInShelf = (m: GoalShelfMeta, section: string): boolean =>
  shelfBlocks(m).some((b) => Number(section) >= b && Number(section) < b + 100);

export const GOAL_SHELF_META: GoalShelfMeta[] = [
  { key: "marriage", label: "Be a better husband, wife or partner", short: "Marriage", base: 8000, extraBases: [10000],
    keywords: ["husband", "wife", "spouse", "marriage", "married", "partner", "relationship", "couple", "divorce", "intimacy"] },
  { key: "parenting", label: "Be a better parent — children who thrive, and the best memories", short: "Parenting", base: 8100, extraBases: [10100],
    keywords: ["parent", "parenting", "father", "mother", "dad", "mom", "kids", "children", "child", "son", "daughter", "toddler", "teen", "memories"] },
  { key: "debt", label: "Get out of debt", short: "Debt", base: 8200, extraBases: [10200],
    keywords: ["debt", "credit card", "loan", "owe", "payoff", "pay off", "bankrupt", "collections", "interest"] },
  { key: "happiness", label: "Be happy — wellbeing that lasts", short: "Happiness", base: 8300, extraBases: [10300],
    keywords: ["happy", "happiness", "wellbeing", "well-being", "joy", "content", "fulfilled", "depress", "anxious", "lonely", "peace"] },
  { key: "retirement", label: "Extra money for a meaningful, active retirement", short: "Retirement", base: 8400, extraBases: [10400],
    keywords: ["retire", "retirement", "401k", "401(k)", "ira", "roth", "pension", "nest egg", "social security", "wealth", "invest"] },
  { key: "business", label: "Start and grow a business", short: "Business", base: 8500, extraBases: [10500],
    keywords: ["business", "startup", "start-up", "company", "entrepreneur", "founder", "self-employed", "side hustle", "clients", "customers"] },
  { key: "hobby", label: "Pick up a new hobby or skill", short: "Hobby & skill", base: 8600, extraBases: [10600],
    keywords: ["hobby", "skill", "learn to", "guitar", "piano", "paint", "language", "chess", "craft", "instrument", "cook", "garden", "woodwork"] },
  { key: "education-career", label: "Graduate college and find the right career", short: "College & career", base: 8700, extraBases: [10700],
    keywords: ["college", "degree", "graduate", "university", "school", "career", "job", "profession", "vocation", "promotion", "resume", "interview"] },
  { key: "partner", label: "Find the right partner and settle down", short: "Finding a partner", base: 8800, extraBases: [10800],
    keywords: ["find a", "dating", "date", "girlfriend", "boyfriend", "settle down", "soulmate", "the one", "single", "engaged", "love"] },
  { key: "home", label: "Buy a house", short: "Home", base: 8900, extraBases: [10900],
    keywords: ["house", "home", "mortgage", "down payment", "homeowner", "real estate", "buy a place", "condo", "apartment"] },
  { key: "travel", label: "Go traveling", short: "Travel", base: 9000, extraBases: [11000],
    keywords: ["travel", "trip", "abroad", "vacation", "backpack", "see the world", "passport", "cruise", "adventure"] },
  { key: "family-time", label: "More time with family, kids and parents", short: "Family time", base: 9100, extraBases: [11100],
    keywords: ["time with", "family time", "grandparent", "grandkids", "aging parent", "elderly parent", "presence", "work-life", "work life", "quality time"] },
  { key: "legacy", label: "Memorialize a life in meaningful ways", short: "Legacy", base: 9200, extraBases: [11200],
    keywords: ["legacy", "memorial", "memoir", "remember", "estate", "will", "generativity", "life story", "heirloom", "letters to", "leave behind"] },
  { key: "health-energy-beauty", label: "Great health, energy and beauty for as long as possible", short: "Health, energy & beauty", base: 9300, extraBases: [11300],
    keywords: ["health", "healthy", "energy", "beauty", "skin", "hair", "look younger", "vitality", "fatigue", "tired", "weight", "fit"] },
  { key: "athlete", label: "Become a better athlete", short: "Athlete", base: 9400, extraBases: [11400],
    keywords: ["athlete", "athletic", "race", "marathon", "triathlon", "faster", "stronger", "compete", "sport", "performance", "pr", "personal record"] },
];

export const GOAL_SHELF_BY_KEY: Record<GoalKey, GoalShelfMeta> = Object.fromEntries(
  GOAL_SHELF_META.map((m) => [m.key, m]),
) as Record<GoalKey, GoalShelfMeta>;

export const doi = (id: string) => `https://doi.org/${id}`;
