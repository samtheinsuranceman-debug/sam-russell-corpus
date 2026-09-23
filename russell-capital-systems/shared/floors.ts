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
 * Every page in the menu belongs to exactly one floor. The owner's rule is at
 * most eight top-level tabs, each opening to about four, then about four more:
 * here the four floors open to at most four rooms of at most four links
 * (control 66: few words above the fold; control 67: no forty-link rail).
 * Everything else on a floor is one keystroke away in its "All tools" index,
 * so nothing reachable today becomes unreachable (server/floorNav.test.ts,
 * server/navReachability.test.ts). Who sees a page is decided by its audience
 * (household, advisor, owner), not by which floor it is on.
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

/**
 * The owner's rule for the top of the menu: at most eight top-level tabs, each
 * opening to about four, each of those to about four more (4 -> 4 -> 4). The
 * four floors are the top level; each floor opens to at most four rooms; each
 * room shows at most four links. Everything else on a floor is in its "All
 * tools" index.
 */
export const MAX_TOP_LEVEL = 8;
export const MAX_ROOMS_PER_FLOOR = 4;
export const MAX_LINKS_PER_ROOM = 4;

/** One short line per floor, for screen readers and the index heading. */
export const FLOOR_BLURB: Record<FloorId, string> = {
  Body: "The household picture",
  Wound: "The problems to solve",
  Work: "The instruments and the advisor doors",
  Talk: "Goldman, the genome and notes",
};

export type FloorLink = { path: string; label: string };

/* ─── Who sees what ──────────────────────────────────────────────────────── */

/**
 * Who a page is for. A household sees its own picture and the instruments; an
 * advisor also sees the book of households, the pipeline, compliance and the
 * advisor doors; the owner also sees the running of the firm.
 */
export type Audience = "household" | "advisor" | "owner";
const RANK: Record<Audience, number> = { household: 0, advisor: 1, owner: 2 };

/** Whether a viewer at one level may see a page for an audience. */
export function canSee(audience: Audience, viewer: Audience): boolean {
  return RANK[viewer] >= RANK[audience];
}

/**
 * The viewer's level. users.role is only "user" or "admin" today, so the owner
 * and admins see everything and everyone else sees the household view.
 * TODO(household-role): when users.role gains "advisor" (and "household"),
 * map "advisor" to "advisor" here; nothing else needs to change.
 */
export function viewerAudience(input: { role?: string | null; isOwner?: boolean }): Audience {
  if (input.isOwner || input.role === "admin") return "owner";
  if (input.role === "advisor") return "advisor";
  return "household";
}

/** Default audience for each top-level menu section; unlisted sections are for households. */
export const SECTION_AUDIENCE: Record<string, Audience> = {
  "Clients": "advisor",
  "Sales & Growth": "advisor",
  "Compliance": "advisor",
  "Settings & Admin": "owner",
};

/** Subgroups whose audience differs from their section, keyed "Section/Subgroup". */
export const SUBGROUP_AUDIENCE: Record<string, Audience> = {
  "Products/Carriers": "advisor",
};

/** Single pages whose audience differs from their subgroup or section. */
export const PATH_AUDIENCE: Record<string, Audience> = {
  // A household's own view inside the Clients section: its assessment, its
  // partner, its risk answers, its own portfolio and score, its notes.
  "/portal/couples": "household",
  "/portal/financial-assessment": "household",
  "/portal/risk-tolerance": "household",
  "/portal/risk-score": "household",
  "/portal/onboarding-quiz": "household",
  "/portal/client-portfolio": "household",
  "/portal/client-financial-health-score": "household",
  "/portal/ai-meeting-notes": "household",
  "/portal/pet": "household",
  // Pages that list the whole book of households (they read clients.list) are advisor pages.
  "/portal/command": "advisor",
  "/portal/command-center": "advisor",
  "/portal/dashboard": "advisor",
  "/portal/nerve-center": "advisor",
  "/portal/financial-vitals": "advisor",
  "/portal/my-world": "advisor",
  "/portal/russell-number": "advisor",
  "/portal/household-wealth": "advisor",
  "/portal/tax-return-upload": "advisor",
  "/portal/bulk-generation": "advisor",
  // Advisor training and advisor-side AI.
  "/portal/advisor-training": "advisor",
  "/portal/agency-tutorial": "advisor",
  "/portal/career-path": "advisor",
  "/portal/certifications": "advisor",
  "/portal/agent-tutorial": "advisor",
  "/portal/training": "advisor",
  "/portal/advisor": "advisor",
  "/portal/co-pilot": "advisor",
  "/portal/whisper-coach": "advisor",
  "/portal/ai-assist": "advisor",
  "/portal/ai-recommender": "advisor",
  "/portal/collaborative-planning": "advisor",
  // The running of the firm.
  "/portal/site-health": "owner",
  "/portal/system-health": "owner",
  "/portal/brain-hub": "owner",
  "/portal/ai-brain-hub": "owner",
  "/portal/lab": "owner",
  "/portal/nav-placeholder": "owner",
};

/** The audience a menu entry is for, by the most specific rule. */
export function audienceOf(entry: { path: string; section: string; subLabel?: string }): Audience {
  const byPath = PATH_AUDIENCE[entry.path];
  if (byPath) return byPath;
  if (entry.subLabel) {
    const bySub = SUBGROUP_AUDIENCE[`${entry.section}/${entry.subLabel}`];
    if (bySub) return bySub;
  }
  return SECTION_AUDIENCE[entry.section] ?? "household";
}

/* ─── Rooms: the second and third levels ─────────────────────────────────── */

export type Room = { label: string; audience: Audience; links: readonly FloorLink[] };

/**
 * The advisor doors. Work only (control 35), and only for advisors and up.
 */
export const ADVISOR_DOORS: readonly FloorLink[] = [
  { path: "/portal/clients", label: "Clients" },
  { path: "/portal/pipeline", label: "Pipeline" },
  { path: "/portal/presentation-builder", label: "Presentations" },
  { path: "/portal/ai-assist", label: "AI assist" },
];

/**
 * Each floor's rooms, and each room's links. Labels are one or two words.
 * A link is also filtered by its own page's audience, so a household room may
 * hold one advisor link that households simply do not see.
 * Every path must be a menu page on the same floor (server/floorNav.test.ts).
 */
export const FLOOR_ROOMS: Record<FloorId, readonly Room[]> = {
  Body: [
    { label: "Us", audience: "household", links: [
      { path: "/portal/financial-assessment", label: "Assessment" },
      { path: "/portal/couples", label: "Spouse view" },
      { path: "/portal/risk-tolerance", label: "Risk" },
      { path: "/portal/plan-ledger", label: "Plan ledger" },
    ] },
    { label: "Assets", audience: "household", links: [
      { path: "/portal/client-portfolio", label: "Portfolio" },
      { path: "/portal/real-estate-portfolio", label: "Property" },
      { path: "/portal/wealth-dashboard", label: "Summary" },
      { path: "/portal/client-financial-health-score", label: "Health score" },
    ] },
    { label: "Households", audience: "advisor", links: [
      { path: "/portal/client-snapshot", label: "Snapshot" },
      { path: "/portal/household-wealth", label: "Household" },
      { path: "/portal/financial-vitals", label: "Vitals" },
      { path: "/portal/client-files", label: "Files" },
    ] },
  ],
  Wound: [
    { label: "Debt", audience: "household", links: [
      { path: "/portal/mortgage-ledger", label: "Mortgage note" },
      { path: "/portal/erosion", label: "Purchasing power" },
      { path: "/portal/wealth-erosion", label: "Erosion" },
      { path: "/portal/market-stress-test", label: "Stress test" },
    ] },
    { label: "Tax heat", audience: "household", links: [
      { path: "/portal/tax-waterfall", label: "Tax heat" },
      { path: "/portal/tax-brackets", label: "Brackets" },
      { path: "/portal/medicare-irmaa", label: "IRMAA" },
      { path: "/portal/tax-alpha-scorecard", label: "Tax score" },
    ] },
    { label: "Gaps", audience: "household", links: [
      { path: "/portal/income-gap", label: "Income gap" },
      { path: "/portal/disability-gap-analyzer", label: "Disability gap" },
      { path: "/portal/retirement-readiness-score", label: "Readiness" },
      { path: "/portal/ai-policy-review", label: "Policy gaps" },
    ] },
    { label: "Estate", audience: "household", links: [
      { path: "/portal/estate-tax", label: "Estate tax" },
      { path: "/portal/estate-timeline", label: "Timeline" },
      { path: "/portal/estate-flow", label: "Estate flow" },
      { path: "/portal/wealth-transfer-scorecard", label: "Transfer" },
    ] },
  ],
  Work: [
    { label: "Income", audience: "household", links: [
      { path: "/portal/sequence-planner", label: "Sequence" },
      { path: "/portal/annuity-explorer", label: "Annuity" },
      { path: "/portal/income-floor-strategy", label: "Income floor" },
      { path: "/portal/social-security", label: "Social Security" },
    ] },
    { label: "Tax-free advantaged", audience: "household", links: [
      { path: "/portal/iul-engine", label: "IUL" },
      { path: "/portal/roth-conversion", label: "Roth" },
      { path: "/portal/iul-vs-roth", label: "Compare" },
      { path: "/portal/policy-loans", label: "Policy loans" },
    ] },
    { label: "Property", audience: "household", links: [
      { path: "/portal/real-estate", label: "Real estate" },
      { path: "/portal/mortgage-killer", label: "Mortgage plan" },
      { path: "/portal/1031-exchange-analyzer", label: "1031" },
      { path: "/portal/trusts", label: "Trust" },
    ] },
    { label: "Advisor doors", audience: "advisor", links: ADVISOR_DOORS },
  ],
  Talk: [
    { label: "Goldman", audience: "household", links: [
      { path: "/portal/samuel-goldman", label: "Goldman" },
      { path: "/portal/ai-advisor", label: "Ask" },
      { path: "/portal/voice", label: "Voice" },
      { path: "/portal/whisperer", label: "Whisperer" },
    ] },
    { label: "Genome", audience: "household", links: [
      { path: "/portal/wealth-genome", label: "Genome" },
      { path: "/portal/the-map", label: "Genome map" },
      { path: "/portal/the-arrival", label: "Arrival" },
      { path: "/portal/the-mirror", label: "Mirror" },
    ] },
    { label: "Notes", audience: "household", links: [
      { path: "/portal/ai-meeting-notes", label: "Notes" },
      { path: "/portal/knowledge", label: "Knowledge" },
      { path: "/portal/meetings", label: "Meetings" },
      { path: "/portal/advisor-chat", label: "Chat" },
    ] },
  ],
};

/** The rooms a viewer sees on a floor, each holding only the links that viewer may see. */
export function roomsFor(
  floor: FloorId,
  viewer: Audience,
  audienceOfPath: (path: string) => Audience,
): Room[] {
  return FLOOR_ROOMS[floor]
    .filter((r) => canSee(r.audience, viewer))
    .map((r) => ({ ...r, links: r.links.filter((l) => canSee(audienceOfPath(l.path), viewer)) }))
    .filter((r) => r.links.length > 0);
}

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
  // Diagnostics that find a problem rather than fix one sit on Wound.
  "/portal/tax-alpha-scorecard": "Wound",
  "/portal/ai-policy-review": "Wound",
  "/portal/policy-review": "Wound",
  "/portal/policy-review-checklist": "Wound",
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
