/**
 * The four floors: Body, Wound, Work, Talk.
 *
 * The owner's verdict on the left rail was "no 59 tabs on the left". The
 * first-login spec (docs/specs/RCS-FIRST-LOGIN-MANAGER.json: floors, stairs,
 * four_tiles) and the intro controls (29-35, 57, 66, 67) replace it with four
 * floors reached by four words, the "stairs", which stay on screen:
 *
 *   Body  - the household picture: snapshot, household, spouse view, files.
 *   Wound - the problems: the mortgage note, tax heat, the gaps, the estate.
 *   Work  - the instruments and engines, plus the advisor doors (clients,
 *           pipeline, presentations, AI assist). Advisor doors live on Work
 *           and nowhere else (control 35).
 *   Talk  - Goldman, the genome, notes.
 *
 * Every page in the menu belongs to exactly one floor. A floor shows at most
 * seven short links (control 66: few words above the fold; control 67: no
 * forty-link rail). Everything else on the floor is one keystroke away in that
 * floor's "All tools" index, so nothing that is reachable today becomes
 * unreachable (server/floorNav.test.ts and server/navReachability.test.ts).
 *
 * Assignment is by rule, most specific first: a path override, then the
 * menu subgroup, then the menu section. A page added to the menu therefore
 * lands on a floor without anyone remembering to place it.
 *
 * Pure data, no React: the tests import it directly.
 */

export type FloorId = "Body" | "Wound" | "Work" | "Talk";

/** The stairs: four words, in this order, always visible after the door. */
export const FLOORS: readonly FloorId[] = ["Body", "Wound", "Work", "Talk"] as const;

/** The spec's active_word_scale: the floor you are on reads 1.25x larger. */
export const ACTIVE_WORD_SCALE = 1.25;

/** Most links a floor shows before "All tools". */
export const MAX_VISIBLE_PER_FLOOR = 7;

/** One short line per floor, for screen readers and the index heading. */
export const FLOOR_BLURB: Record<FloorId, string> = {
  Body: "The household picture",
  Wound: "The problems to solve",
  Work: "The instruments and the advisor doors",
  Talk: "Goldman, the genome and notes",
};

export type FloorLink = { path: string; label: string };

/**
 * The few links each floor shows. Labels are one or two words on purpose.
 * Every path must be in the menu and must be assigned to the same floor
 * (asserted in server/floorNav.test.ts).
 */
export const FLOOR_FEATURED: Record<FloorId, readonly FloorLink[]> = {
  Body: [
    { path: "/portal/client-snapshot", label: "Snapshot" },
    { path: "/portal/household-wealth", label: "Household" },
    { path: "/portal/couples", label: "Spouse view" },
    { path: "/portal/client-files", label: "Files" },
    { path: "/portal/plan-ledger", label: "Plan ledger" },
    { path: "/portal/financial-vitals", label: "Vitals" },
  ],
  Wound: [
    { path: "/portal/mortgage-ledger", label: "Mortgage note" },
    { path: "/portal/tax-waterfall", label: "Tax heat" },
    { path: "/portal/income-gap", label: "Income gap" },
    { path: "/portal/disability-gap-analyzer", label: "Disability gap" },
    { path: "/portal/estate-tax", label: "Estate" },
  ],
  Work: [
    { path: "/portal/sequence-planner", label: "Sequence" },
    { path: "/portal/iul-engine", label: "IUL" },
    { path: "/portal/roth-conversion", label: "Roth" },
    { path: "/portal/real-estate", label: "Real estate" },
    { path: "/portal/annuity-explorer", label: "Annuity" },
    { path: "/portal/trusts", label: "Trust" },
  ],
  Talk: [
    { path: "/portal/samuel-goldman", label: "Goldman" },
    { path: "/portal/wealth-genome", label: "Genome" },
    { path: "/portal/the-map", label: "Genome map" },
    { path: "/portal/ai-meeting-notes", label: "Notes" },
    { path: "/portal/meetings", label: "Meetings" },
  ],
};

/**
 * The advisor doors. Work only (control 35). Rendered behind one "Advisor
 * doors" disclosure, so Work still shows seven controls at most.
 */
export const ADVISOR_DOORS: readonly FloorLink[] = [
  { path: "/portal/clients", label: "Clients" },
  { path: "/portal/pipeline", label: "Pipeline" },
  { path: "/portal/presentation-builder", label: "Presentations" },
  { path: "/portal/ai-assist", label: "AI assist" },
];

/** Default floor for each top-level menu section. */
export const SECTION_FLOOR: Record<string, FloorId> = {
  "Home": "Body",
  "Clients": "Work",
  "Planning": "Work",
  "Products": "Work",
  "Real Estate": "Work",
  "Sales & Growth": "Work",
  "Compliance": "Work",
  "Learning": "Talk",
  "AI & Tools": "Work",
  "Settings & Admin": "Work",
};

/** Subgroups that sit on a different floor from their section, keyed "Section/Subgroup". */
export const SUBGROUP_FLOOR: Record<string, FloorId> = {
  "Clients/Health & Scoring": "Body",
  "Clients/Meetings & Notes": "Talk",
  "Planning/Wealth Genome": "Talk",
};

/** Single pages that sit on a different floor from their subgroup or section. */
export const PATH_FLOOR: Record<string, FloorId> = {
  // Home: the advisor's command screens are Work; Goldman is Talk.
  "/portal/command": "Work",
  "/portal/command-center": "Work",
  "/portal/dashboard": "Work",
  "/portal/nerve-center": "Work",
  "/portal/site-health": "Work",
  "/portal/system-health": "Work",
  "/portal/samuel-goldman": "Talk",

  // Clients: the household's own view and files are Body.
  "/portal/couples": "Body",
  "/portal/client-files": "Body",
  "/portal/welcome": "Body",
  "/portal/client-onboarding": "Body",
  "/portal/onboarding": "Body",
  "/portal/onboarding-v2": "Body",
  "/portal/pet": "Talk",
  // Comparing households against each other is advisor work, not one household's picture.
  "/portal/comparison": "Work",
  "/portal/client-comparison": "Work",
  "/portal/engagement-score": "Work",
  "/portal/stale-digest": "Work",

  // Planning: the problems are Wound, the household ledger is Body.
  "/portal/income-gap": "Wound",
  "/portal/disability-gap-analyzer": "Wound",
  "/portal/retirement-readiness-score": "Wound",
  "/portal/tax-waterfall": "Wound",
  "/portal/tax-brackets": "Wound",
  "/portal/medicare-irmaa": "Wound",
  "/portal/nii-surtax": "Wound",
  "/portal/depreciation-recapture": "Wound",
  "/portal/tax-return-upload": "Body",
  "/portal/estate-tax": "Wound",
  "/portal/estate-planning": "Wound",
  "/portal/estate-timeline": "Wound",
  "/portal/estate-flow": "Wound",
  "/portal/post-mortem-tax": "Wound",
  "/portal/wealth-transfer-scorecard": "Wound",
  "/portal/divorce-calculator": "Wound",
  "/portal/wealth-erosion": "Wound",
  "/portal/erosion": "Wound",
  "/portal/outside-forces": "Wound",
  "/portal/market-stress-test": "Wound",
  "/portal/wealth-dashboard": "Body",
  "/portal/plan-ledger": "Body",
  "/portal/financial-plan-checklist": "Body",
  "/portal/household-wealth": "Body",
  // The numbered journey (1-5 under Wealth Genome) stays together on Talk.
  "/portal/the-legacy": "Talk",
  "/portal/the-brotherhood": "Talk",

  // Real estate: the note itself is the wound; the instruments are Work.
  "/portal/mortgage-ledger": "Wound",
  "/portal/real-estate-portfolio": "Body",

  // Compliance: the household's own documents are Body.
  "/portal/document-vault": "Body",

  // Learning: advisor training is Work, not Talk.
  "/portal/advisor-training": "Work",
  "/portal/agency-tutorial": "Work",
  "/portal/career-path": "Work",
  "/portal/certifications": "Work",
  "/portal/agent-tutorial": "Work",
  "/portal/training": "Work",

  // AI & Tools: the conversations are Talk; assist and recommenders stay Work.
  "/portal/thomas-goldman": "Talk",
  "/portal/ai-advisor": "Talk",
  "/portal/whisperer": "Talk",
  "/portal/voice": "Talk",
  "/portal/voice-plan": "Talk",
};

/** One menu entry as the shell declares it. */
export type NavEntry = { path: string; label: string; section: string; subLabel?: string };

/** The floor a menu entry belongs to. Exactly one, by the most specific rule. */
export function floorOf(entry: Pick<NavEntry, "path" | "section" | "subLabel">): FloorId {
  const byPath = PATH_FLOOR[entry.path];
  if (byPath) return byPath;
  if (entry.subLabel) {
    const bySub = SUBGROUP_FLOOR[`${entry.section}/${entry.subLabel}`];
    if (bySub) return bySub;
  }
  return SECTION_FLOOR[entry.section] ?? "Work";
}

/**
 * The floor the current location sits on: the entry whose path equals the
 * location, else the longest entry path that prefixes it (a detail page such
 * as /portal/clients/12 sits with /portal/clients). Null when nothing matches.
 */
export function floorForLocation(location: string, entries: readonly NavEntry[]): FloorId | null {
  let best: NavEntry | null = null;
  for (const e of entries) {
    if (location === e.path) return floorOf(e);
    if (e.path !== "/portal" && location.startsWith(`${e.path}/`)) {
      if (!best || e.path.length > best.path.length) best = e;
    }
  }
  return best ? floorOf(best) : null;
}

/** Case-insensitive match on the label, the path, and the menu section and subgroup names. */
export function matchesQuery(entry: NavEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    entry.label.toLowerCase().includes(q) ||
    entry.path.toLowerCase().includes(q) ||
    entry.section.toLowerCase().includes(q) ||
    (entry.subLabel ?? "").toLowerCase().includes(q)
  );
}

/** Read the nav mode switch. "floors" or "classic" from storage wins; otherwise the env flag. */
export function resolveNavMode(stored: string | null | undefined, envFlag: string | undefined): "floors" | "classic" {
  if (stored === "floors") return "floors";
  if (stored === "classic") return "classic";
  return String(envFlag ?? "").trim().toLowerCase() === "on" ? "floors" : "classic";
}

/** The localStorage key and the event the shell listens for when it changes in this tab. */
export const NAV_MODE_KEY = "nav";
export const NAV_MODE_EVENT = "rcs-nav-mode";
