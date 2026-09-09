/**
 * The rooms of Russell Capital Systems.
 *
 * Grok's theme map (THEME_MAP_12_SECTIONS.md) puts the 257 declared routes
 * into 12 sections and gives each section one of ten themes. Every theme is
 * the same 14 token roles with different values; the components (tabs, H1,
 * body, money, Calculate) obey the room and never invent an eleventh one.
 *
 * `routeToTheme(path)` is the single source of truth the client uses to stamp
 * `data-room`, `data-needle`, `data-quiet` and `data-light` on <html>; the
 * stylesheet does the rest. Nothing here touches copy or numbers.
 *
 * Token roles are Grok's names with a `room-` prefix in CSS (`--room-canvas`)
 * because `--muted` already belongs to the component library's background
 * token and the two must not collide.
 */

export type ThemeId =
  | "theme1" // Surgical Midnight — the cover, above the fold on "/"
  | "theme2" // Private Banking Navy — public house + portal cockpit
  | "theme3" // Quiet Luxury — clients, intake, human tools, education
  | "theme5" // Tax Sanctuary — parchment + forest
  | "theme6" // Integration / Calculus — prediction and outside forces
  | "theme7" // Legacy Oxblood — protection, estate, legacy
  | "theme8" // Horizon Pacific — journey and welcome
  | "theme9" // Carbon Instrument — every calculator and engine
  | "theme10" // Ivory Clinic — printed and shared artifacts
  | "theme11"; // Observatory Indigo — mirrors, ideas, patent showcase

export type Needle = "gold" | "horizon" | "forest" | "steel" | "cyan" | "oxblood" | "champagne";

export type Cast = "surgeon" | "physician" | "psychiatrist" | "relief";

export interface ThemeTokens {
  canvas: string;
  surface: string;
  surfaceHover: string;
  tab: string;
  tabActive: string;
  text: string;
  heading: string;
  money: string;
  line: string;
  fill: string;
  calculate: string;
  calculateHover: string;
  grid: string;
  muted: string;
  danger: string;
  hairline: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  /** Light rooms flip the ink; dark rooms keep it. */
  light: boolean;
  /** Which face carries the H1 in this room. */
  headingFace: "display" | "ui";
  /** Paper grain / coordinate grid strength, 0 = none. */
  grain: number;
  grid: number;
  tokens: ThemeTokens;
}

export const COPPER = "#C45C26";
export const COPPER_HOVER = "#D4682E";
export const SEAL_BROWN = "#8B5A2B";
export const IVORY_INK = "#F7F4EE";
export const ENERGY_LINE = "#3EE0A2";

export const NEEDLE_HEX: Record<Needle, string> = {
  gold: "#C9A227",
  horizon: "#E6C36A",
  forest: "#3D6B4F",
  steel: "#5B8FB9",
  cyan: "#7EC8E3",
  oxblood: "#8E1E2A",
  champagne: "#E8D5A3",
};

export const CAST: Record<Cast, { word: string; pip: string; needle: Needle }> = {
  surgeon: { word: "Surgeon", pip: NEEDLE_HEX.steel, needle: "steel" },
  physician: { word: "Physician", pip: NEEDLE_HEX.champagne, needle: "champagne" },
  psychiatrist: { word: "Psychiatrist", pip: "#6F74C9", needle: "cyan" },
  relief: { word: "Recovery & Relief", pip: NEEDLE_HEX.forest, needle: "forest" },
};

const dark = (t: Partial<ThemeTokens> & Pick<ThemeTokens, "canvas" | "surface" | "line">): ThemeTokens => ({
  surfaceHover: t.surface,
  tab: "#8E96A6",
  tabActive: "#F2EDE3",
  text: "#D8DDE6",
  heading: "#F2EDE3",
  money: "#E6C36A",
  fill: "rgba(201,162,39,0.10)",
  calculate: COPPER,
  calculateHover: COPPER_HOVER,
  grid: "transparent",
  muted: "#7F8797",
  danger: "#E5484D",
  hairline: "#C9A227",
  ...t,
});

export const THEMES: Record<ThemeId, Theme> = {
  theme1: {
    id: "theme1",
    name: "Surgical Midnight",
    light: false,
    headingFace: "ui",
    grain: 0,
    grid: 0,
    tokens: dark({
      canvas: "#07080C",
      surface: "#0E1016",
      surfaceHover: "#131622",
      line: ENERGY_LINE,
      fill: "rgba(62,224,162,0.12)",
      heading: "#F4F1E8",
      text: "#E6E8EE",
      tab: "#9AA0AD",
      tabActive: "#F4F1E8",
    }),
  },
  theme2: {
    id: "theme2",
    name: "Private Banking Navy",
    light: false,
    headingFace: "ui",
    grain: 0,
    grid: 0,
    tokens: dark({
      canvas: "#0B1220",
      surface: "#111A2C",
      surfaceHover: "#16213A",
      line: "#C9A227",
      tab: "#8FA1BD",
      muted: "#7C8BA5",
      text: "#D5DCE8",
      heading: "#F2EBDD",
    }),
  },
  theme3: {
    id: "theme3",
    name: "Quiet Luxury",
    light: false,
    headingFace: "display",
    grain: 0.04,
    grid: 0,
    tokens: dark({
      canvas: "#16171A",
      surface: "#1E1F23",
      surfaceHover: "#25262B",
      line: "#E8D5A3",
      fill: "rgba(232,213,163,0.10)",
      money: "#E8D5A3",
      tab: "#9C978C",
      tabActive: "#F1E9DA",
      text: "#E4DDD0",
      heading: "#F1E9DA",
      muted: "#8C877C",
      hairline: "#E8D5A3",
    }),
  },
  theme5: {
    id: "theme5",
    name: "Tax Sanctuary",
    light: true,
    headingFace: "display",
    grain: 0.08,
    grid: 0,
    tokens: {
      canvas: "#F3EDE0",
      surface: "#FBF7EE",
      surfaceHover: "#FFFCF5",
      tab: "#5D655F",
      tabActive: "#1F2A24",
      text: "#2A2F2C",
      heading: "#1F2A24",
      money: "#8A6A1F",
      line: "#3D6B4F",
      fill: "rgba(61,107,79,0.12)",
      calculate: SEAL_BROWN,
      calculateHover: "#9E6A38",
      grid: "transparent",
      muted: "#6B716C",
      danger: "#A3322D",
      hairline: "#3D6B4F",
    },
  },
  theme6: {
    id: "theme6",
    name: "Integration / Calculus",
    light: false,
    headingFace: "ui",
    grain: 0,
    grid: 0.08,
    tokens: dark({
      canvas: "#0A0F14",
      surface: "#10171F",
      surfaceHover: "#151E28",
      line: "#7EC8E3",
      fill: "rgba(126,200,227,0.12)",
      grid: "rgba(126,200,227,0.06)",
      tab: "#7F93A6",
      tabActive: "#EEF3F7",
      text: "#D7DEE6",
      heading: "#EEF3F7",
      muted: "#7A8A9A",
      hairline: "#7EC8E3",
    }),
  },
  theme7: {
    id: "theme7",
    name: "Legacy Oxblood",
    light: false,
    headingFace: "display",
    grain: 0,
    grid: 0,
    tokens: dark({
      canvas: "#1A0C0E",
      surface: "#251316",
      surfaceHover: "#2E181C",
      line: "#C9A227",
      tab: "#A48A8C",
      tabActive: "#F3E8DF",
      text: "#E8DAD6",
      heading: "#F3E8DF",
      muted: "#9A8486",
      danger: "#C0392B",
    }),
  },
  theme8: {
    id: "theme8",
    name: "Horizon Pacific",
    light: false,
    headingFace: "ui",
    grain: 0,
    grid: 0,
    tokens: dark({
      canvas: "#0B141B",
      surface: "#12202A",
      surfaceHover: "#172833",
      line: "#E6C36A",
      fill: "rgba(230,195,106,0.10)",
      tab: "#86A0AC",
      tabActive: "#F0F5F5",
      text: "#D9E2E6",
      heading: "#F0F5F5",
      muted: "#7C949F",
      hairline: "#E6C36A",
    }),
  },
  theme9: {
    id: "theme9",
    name: "Carbon Instrument",
    light: false,
    headingFace: "ui",
    grain: 0,
    grid: 0.04,
    tokens: dark({
      canvas: "#0C0D0F",
      surface: "#141619",
      surfaceHover: "#1A1D21",
      line: NEEDLE_HEX.gold,
      money: "#C9A227",
      grid: "rgba(255,255,255,0.04)",
      tab: "#8E939B",
      tabActive: "#F2F2F0",
      text: "#D9DBDF",
      heading: "#F2F2F0",
      muted: "#7E848D",
    }),
  },
  theme10: {
    id: "theme10",
    name: "Ivory Clinic",
    light: true,
    headingFace: "display",
    grain: 0.03,
    grid: 0,
    tokens: {
      canvas: "#F7F4EE",
      surface: "#FFFFFF",
      surfaceHover: "#FBF9F4",
      tab: "#5A6577",
      tabActive: "#0B1220",
      text: "#1C2230",
      heading: "#0B1220",
      money: "#8A6A1F",
      line: "#0B1220",
      fill: "rgba(11,18,32,0.08)",
      calculate: "#0B1220",
      calculateHover: "#16213A",
      grid: "transparent",
      muted: "#6A7383",
      danger: "#A3322D",
      hairline: "#0B1220",
    },
  },
  theme11: {
    id: "theme11",
    name: "Observatory Indigo",
    light: false,
    headingFace: "ui",
    grain: 0,
    grid: 0,
    tokens: dark({
      canvas: "#0E0F1F",
      surface: "#171935",
      surfaceHover: "#1D2042",
      line: "#6F74C9",
      fill: "rgba(111,116,201,0.12)",
      tab: "#8F92B8",
      tabActive: "#F1F0FA",
      text: "#DCDCEA",
      heading: "#F1F0FA",
      muted: "#8286A8",
      hairline: "#6F74C9",
    }),
  },
};

export interface Room {
  theme: ThemeId;
  /** Theme 9 accent; also carried by the three public calculators. */
  needle: Needle | null;
  /** Quiet pages carry the identity and do not perform. */
  quiet: boolean;
  /** 1–12 from PAGE_ROLES_FOR_THEMING.md. */
  section: number;
  /** The specialist badge this room may wear as an eyebrow, if any. */
  cast: Cast | null;
}

const set = (...paths: string[]) => new Set(paths);

/* ── Section lists, verbatim from the theme map ─────────────────────────── */

const QUIET_PUBLIC = set("/privacy", "/terms", "/login", "/register", "/forgot-password", "/reset-password", "/invite", "/404");
const PUBLIC_HOUSE = set("/pricing", "/support", "/trial", "/administrator", "/executive");
const PUBLIC_CALCULATORS: Record<string, Needle> = {
  "/calculators": "champagne",
  "/ultra-calculator": "cyan",
  "/fact-finder": "steel",
};
const COCKPIT = set(
  "/portal", "/portal/dashboard", "/portal/advisory-summary", "/portal/client-health", "/portal/client-portfolio",
  "/portal/command-center", "/portal/nerve-center", "/portal/daily-briefing", "/portal/morning-ritual",
);
const CLIENTS = set(
  "/portal/clients", "/portal/leads", "/portal/planning-cases", "/portal/client-intake", "/portal/client-intake-recommender",
  "/portal/client-onboarding", "/portal/client-onboarding-auto", "/portal/onboarding", "/portal/onboarding-v2", "/onboarding",
  "/portal/client-files", "/portal/client-snapshot", "/portal/client-scorecard", "/portal/connections", "/portal/couples",
  "/portal/secondary-information", "/portal/business-owner", "/portal/household-wealth", "/portal/goals-planning",
  "/portal/risk-tolerance", "/portal/engagement-score", "/portal/meeting-agenda", "/portal/meetings", "/portal/ai-meeting-notes",
);
const HORIZON = set(
  "/portal/welcome", "/portal/my-journey", "/portal/the-arrival", "/portal/the-map", "/portal/the-field",
  "/portal/plan-ledger", "/portal/controls", "/portal/wealth-genome", "/portal/financial-assessment", "/portal/daily-discovery",
  "/portal/wrapped", "/portal/the-strategy-table", "/portal/my-world",
);
const INDIGO = set("/portal/ai-advisor", "/portal/the-mirror", "/portal/black-mirror", "/portal/avatar-twins", "/portal/patent-showcase", "/portal/combo-recommender");
const TAX = set(
  "/portal/charitable-giving", "/portal/estate-tax", "/portal/hidden-material", "/portal/physicians-edge", "/portal/secret-secrets",
  "/portal/str-strategy", "/portal/tax-advantaged-growth", "/portal/tax-brackets", "/portal/tax-combos", "/portal/tax-loss-harvesting",
  "/portal/tax-opportunities", "/portal/tax-return-upload", "/portal/tax-schedule", "/portal/tax-waterfall", "/portal/toilet",
);
const CALCULUS = set(
  "/portal/crypto-corner", "/portal/ecological-drivers", "/portal/erosion", "/portal/forgiveness", "/portal/ibbotson-charts",
  "/portal/index-strategies", "/portal/inflation", "/portal/market-data", "/portal/market-stress-test", "/portal/portfolio-drift",
  "/portal/predictive-analytics", "/portal/sphere", "/portal/time-lapse", "/portal/time-machine", "/portal/time-machine-ag49",
  "/portal/time-machine-calculator", "/portal/time-machine-method", "/portal/zip-engine",
);
const ESTATE = set(
  "/portal/trusts", "/portal/will-writer", "/portal/succession-planning", "/portal/estate-document-gen", "/portal/ai-policy-review",
  "/portal/policy-review", "/portal/policy-review-checklist", "/portal/the-legacy",
);
const QUIET_COCKPIT = set(
  "/portal/admin", "/portal/billing", "/portal/branding", "/portal/compliance", "/portal/compliance-alerts", "/portal/compliance-audit",
  "/portal/compliance-audit-trail", "/portal/compliance-monitoring", "/portal/compliance-reports", "/portal/document-vault",
  "/portal/fee-transparency", "/portal/integrations", "/portal/legal-payment-folder", "/portal/monitoring-agreement",
  "/portal/owner-oversight", "/portal/settings", "/portal/site-health", "/portal/system-health", "/portal/webhooks",
  "/portal/website-usage", "/portal/team", "/portal/team-management", "/portal/enterprise", "/portal/hubspot", "/portal/slack",
  "/portal/client-portal-config",
);
const WORK_COCKPIT = set(
  "/portal/pipeline", "/portal/deals", "/portal/commission-tracker", "/portal/referral-tracker", "/portal/referral-tracking",
  "/portal/lead-generator", "/portal/advanced-reporting", "/portal/data-query", "/portal/audit-timeline", "/portal/stale-digest",
  "/portal/workflow-automations", "/portal/email-campaigns", "/portal/affiliate-links",
);
const HUMAN_TOOLS = set(
  "/portal/advisor-chat", "/portal/ai", "/portal/ai-assist", "/portal/ai-slides", "/portal/my-slides", "/portal/batch-slides",
  "/portal/presentation-builder", "/portal/sales-story", "/portal/story-generator", "/portal/war-story-generator",
  "/portal/seminar-generator", "/portal/video-proposals", "/portal/wealth-reels", "/portal/voice-plan", "/portal/knowledge",
  "/portal/advisor-training", "/portal/agency-tutorial", "/portal/agent-tutorial", "/portal/arena", "/portal/war-room",
  "/portal/leaderboard", "/portal/rewards", "/portal/pet", "/portal/co-pilot", "/portal/collaborative-planning",
  "/portal/client-self-service", "/portal/advisor-directory", "/portal/infinite-scroll", "/portal/social",
  "/portal/document-templates", "/portal/bulk-generation", "/portal/education", "/portal/video-library",
);

/** Theme 9 needle map — accent line, fill and live pip only. */
export const NEEDLES: Record<string, Needle> = {
  // Gold — cash value / IUL / policy mechanics
  "/portal/iul-historical": "gold", "/portal/iul-vs-roth": "gold", "/portal/policy-loans": "gold", "/portal/premium-financing": "gold",
  "/portal/quick-quote": "gold", "/portal/quotes": "gold", "/portal/batch-illustration": "gold", "/portal/illustration-compare": "gold",
  "/portal/comparison": "gold", "/portal/client-comparison": "gold", "/portal/carrier-comparison": "gold", "/portal/carrier-rates": "gold",
  "/portal/carrier-ratings": "gold", "/portal/carrier-settings": "gold", "/portal/russell-number": "gold", "/portal/iul-engine": "gold",
  // Horizon gold — retirement income / annuities / lifetime pay
  "/portal/annuity-accumulation-db": "horizon", "/portal/annuity-memory": "horizon", "/portal/athene-guaranteed-income": "horizon",
  "/portal/athene-pe-plus15": "horizon", "/portal/existing-annuities": "horizon", "/portal/fia-top10": "horizon",
  "/portal/growth-annuities": "horizon", "/portal/income-annuity-top10": "horizon", "/portal/lifetime-income": "horizon",
  "/portal/hot-income": "horizon", "/portal/income-gap": "horizon", "/portal/income-timeline": "horizon",
  "/portal/withdrawal-sequencing": "horizon", "/portal/retirement-guardrails": "horizon", "/portal/retirement-projection": "horizon",
  "/portal/myga-fixed-rate": "horizon", "/portal/social-security": "horizon", "/portal/medicare-irmaa": "horizon",
  "/portal/income-for-life": "horizon", "/portal/long-term-care": "horizon",
  // Forest — tax engines that live in the calculator role
  "/portal/roth-conversion": "forest", "/portal/beneficiary-optimization": "forest",
  // Steel — real estate / debt / house
  "/portal/house-recycling": "steel", "/portal/mortgage-killer": "steel", "/portal/mortgage-killer-v3": "steel",
  "/portal/reverse-heloc": "steel", "/portal/real-estate-mogul": "steel", "/portal/short-term-rentals": "steel",
  "/portal/rental-enterprise": "steel",
  // Cyan — models, probability, index math
  "/portal/index-backtester": "cyan", "/portal/axonic-sp500": "cyan", "/portal/endgame": "cyan", "/portal/scenario-play": "cyan",
  "/portal/scenario-side-by-side": "cyan", "/portal/scenarios": "cyan", "/portal/saved-scenarios": "cyan",
  "/portal/strategy-compare": "cyan", "/portal/rebalance": "cyan", "/portal/smart-rebalancing": "cyan", "/portal/financial-vitals": "cyan",
  // Oxblood — multi-gen / estate flow that is a calculator
  "/portal/estate-flow": "oxblood", "/portal/multi-gen-wealth": "oxblood", "/portal/inheritance": "oxblood",
  // Champagne — advisor economics / misc
  "/portal/advisor-income-calculator": "champagne", "/portal/commission-calculator": "champagne",
  "/portal/divorce-calculator": "champagne", "/portal/the-brotherhood": "champagne",
};

const SHARED_PREFIXES = ["/shared", "/shared-slides", "/video", "/client-portal"];
const TAX_PREFIXES = ["/portal/tax-", "/portal/charitable-", "/portal/str-", "/portal/secret-secrets"];
const CALCULUS_PREFIXES = ["/portal/time-", "/portal/market-", "/portal/ibbotson", "/portal/predictive", "/portal/crypto", "/portal/ecological"];
const ESTATE_PREFIXES = ["/portal/succession", "/portal/estate-document", "/portal/policy-review"];
const COMPLIANCE_PREFIXES = ["/portal/compliance"];

function normalize(path: string): string {
  let p = (path || "/").split("?")[0].split("#")[0];
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

/** `/portal/clients/42` → `/portal/clients`; `/portal/tax-combos/7` → `/portal/tax-combos`. */
function parent(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 2) return path;
  return "/" + parts.slice(0, 2).join("/");
}

const room = (theme: ThemeId, section: number, extra: Partial<Room> = {}): Room => ({
  theme,
  needle: null,
  quiet: false,
  section,
  cast: null,
  ...extra,
});

export function routeToTheme(rawPath: string): Room {
  const path = normalize(rawPath);

  if (path === "/") return room("theme1", 1);

  if (QUIET_PUBLIC.has(path)) return room("theme2", 2, { quiet: true });
  if (PUBLIC_HOUSE.has(path)) return room("theme2", 2);
  if (path in PUBLIC_CALCULATORS) return room("theme9", 3, { needle: PUBLIC_CALCULATORS[path] });
  if (SHARED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) return room("theme10", 12, { quiet: true });
  if (path === "/onboarding") return room("theme3", 5);
  if (path.startsWith("/for/") || path === "/for") return room("theme2", 2);

  if (!path.startsWith("/portal")) return room("theme2", 2);

  const base = parent(path);

  if (COCKPIT.has(base)) return room("theme2", 4);
  if (CLIENTS.has(base)) return room("theme3", 5);
  if (INDIGO.has(base)) return room("theme11", 6, { cast: "psychiatrist" });
  if (HORIZON.has(base)) return room("theme8", 6, { cast: "relief" });
  if (TAX.has(base) || TAX_PREFIXES.some((p) => base.startsWith(p))) return room("theme5", 7, { cast: "physician" });
  if (CALCULUS.has(base) || CALCULUS_PREFIXES.some((p) => base.startsWith(p))) return room("theme6", 8);
  if (ESTATE.has(base) || ESTATE_PREFIXES.some((p) => base.startsWith(p))) return room("theme7", 10, { cast: "physician" });
  if (base in NEEDLES) return room("theme9", 9, { needle: NEEDLES[base] });
  if (QUIET_COCKPIT.has(base) || COMPLIANCE_PREFIXES.some((p) => base.startsWith(p))) return room("theme2", 11, { quiet: true });
  if (WORK_COCKPIT.has(base)) return room("theme2", 11);
  if (HUMAN_TOOLS.has(base)) return room("theme3", 11);

  return room("theme2", 4);
}

/** The HTML attributes the client stamps on <html> for a path. */
export function roomAttributes(path: string): Record<string, string> {
  const r = routeToTheme(path);
  const t = THEMES[r.theme];
  const attrs: Record<string, string> = { "data-room": r.theme, "data-section": String(r.section) };
  if (r.needle) attrs["data-needle"] = r.needle;
  if (r.quiet) attrs["data-quiet"] = "1";
  if (t.light) attrs["data-light"] = "1";
  if (r.cast) attrs["data-cast"] = r.cast;
  return attrs;
}

export const ROOM_ATTRIBUTE_NAMES = ["data-room", "data-section", "data-needle", "data-quiet", "data-light", "data-cast"] as const;

/** Every route the map names, for the inventory doc and the tests. */
export function themedRouteInventory(): Array<{ path: string; theme: ThemeId; needle: Needle | null; quiet: boolean }> {
  const groups: Array<Iterable<string>> = [
    ["/"], QUIET_PUBLIC, PUBLIC_HOUSE, Object.keys(PUBLIC_CALCULATORS), COCKPIT, CLIENTS, HORIZON, INDIGO, TAX, CALCULUS, ESTATE,
    QUIET_COCKPIT, WORK_COCKPIT, HUMAN_TOOLS, Object.keys(NEEDLES),
    ["/shared/:token", "/shared-slides/:token", "/video/:token", "/client-portal/:token"],
  ];
  const all = new Set<string>();
  for (const g of groups) Array.from(g).forEach((p) => all.add(p));
  return Array.from(all).sort().map((path) => {
    const r = routeToTheme(path);
    return { path, theme: r.theme, needle: r.needle, quiet: r.quiet };
  });
}
