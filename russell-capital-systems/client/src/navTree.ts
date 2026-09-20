// ─── Navigation tree ────────────────────────────────────────────────────────
//
// A recursive navigation structure. Every node is either a FOLDER (has
// `children`) or a LEAF (has `path`, or `isPlaceholder` when no route exists
// yet). Folders nest to any depth; the renderer walks them recursively, so
// adding a level is a data change rather than a component change.
//
// ## Why this replaced the flat two-level shape
//
// The previous structure was `NAV_SECTIONS: { label, items[], subgroups[] }`,
// hard-coded inside AppShell.tsx. It could express exactly two levels —
// section, then subgroup — and nothing deeper. Sections that outgrew that
// shape simply went flat: "Rental Properties" carried 21 sibling links and
// "New Client Welcome List" carried 20, with no way to group them without
// changing the renderer.
//
// Nesting here is data. A folder that gets too long is split by adding a
// `children` array, and the renderer needs no edit.
//
// ## The content is unchanged
//
// This tree holds the same 172 destinations the flat structure held, with the
// same labels and the same paths. Nothing was added and nothing was dropped;
// `server/navTree.test.ts` pins that against a frozen list so a future edit
// cannot silently lose a destination.
//
// Two exceptions, both pre-existing bugs this move surfaced and did not create:
//
//   /portal/knowledge-library  →  retargeted to /portal/knowledge
//        The old path is in no router and 404s. `Knowledge.tsx` is the page it
//        was pointing at.
//   /portal/tool-explorer      →  marked `isPlaceholder`
//        The old path is in no router and 404s. There is no obviously correct
//        replacement — /portal/explore exists but is a different page — so
//        rather than guess, the entry stays visible and inert until someone
//        who knows the intent picks a target.
//
// ## Keeping it correct
//
// Every `path` must exist in `shared/routeManifest.ts`. `validateNavTree()`
// checks that, and `server/navTree.test.ts` fails the build on a path that
// does not resolve or on a destination that appears twice. A nav entry
// pointing at a route that does not exist is a 404 the user finds; this
// makes it a test failure the author finds.

export type NavNode = {
  label: string;
  /** Route path. Mutually exclusive with `children`. */
  path?: string;
  /** A destination that has no route yet. Renders inert, with a marker. */
  isPlaceholder?: boolean;
  /** Present on folders. Mutually exclusive with `path`. */
  children?: NavNode[];
  /** Folders open collapsed unless this is set. */
  defaultOpen?: boolean;
};

/** Leaf shorthand. */
const l = (label: string, path: string): NavNode => ({ label, path });

/** Placeholder shorthand — a destination with no route yet. */
const ph = (label: string): NavNode => ({ label, isPlaceholder: true });

/** Folder shorthand. */
const f = (label: string, children: NavNode[]): NavNode => ({ label, children });

export const NAV_TREE: NavNode[] = [
  // ══ 1. HOME ══════════════════════════════════════════════════════════════
  f("Home", [
    f("Dashboards", [
      l("Wealth Reels", "/portal"),
      l("Dashboard", "/portal/dashboard"),
      l("Physician Dashboard", "/portal/physician"),
      l("Client Dashboard", "/portal/client"),
      l("Advisor Dashboard", "/portal/advisor"),
    ]),
    f("AI Copilots", [
      l("AI Whisperer", "/portal/whisperer"),
      l("Voice Studio", "/portal/voice"),
      l("Calculator Chain", "/portal/chain"),
    ]),
    f("Client Health", [
      l("Advisory Summary", "/portal/advisory-summary"),
      l("Client Health", "/portal/client-health"),
      l("Client Portfolio", "/portal/client-portfolio"),
    ]),
  ]),

  // ══ 2. RENTAL PROPERTIES ═════════════════════════════════════════════════
  // Was 21 flat siblings. Grouped by what the tool does.
  f("Rental Properties", [
    f("Short-Term Rental", [
      l("Short-Term Rentals", "/portal/short-term-rentals"),
      l("STR Tax Strategy", "/portal/str-strategy"),
      l("The Zip Engine", "/portal/zip-engine"),
    ]),
    f("Portfolio & Acquisition", [
      l("The Rental Enterprise", "/portal/rental-enterprise"),
      l("Real Estate Mogul", "/portal/real-estate-mogul"),
      l("Real Estate Intelligence", "/portal/recin"),
      l("House Recycling", "/portal/house-recycling"),
      l("Practice Acquisition Diligence", "/portal/practice-acquisition"),
    ]),
    f("Lending & Leverage", [
      l("Physician Loan Refi", "/portal/physician-loan-refi"),
      l("IUL Loan Optimizer", "/portal/iul-loan-optimizer"),
      l("Alternative Lines of Credit", "/portal/alt-credit"),
      l("Infinite Banking", "/portal/infinite-banking"),
      l("Exchange Chain Optimizer", "/portal/exchange-chain"),
    ]),
    f("Protection & Transfer", [
      l("Disability Gap Analyzer", "/portal/disability-gap-analyzer"),
      l("Hybrid Income Floor", "/portal/hybrid-income-floor"),
      l("Multi-Gen Transfer", "/portal/multi-gen-transfer"),
      l("Key Person Valuation", "/portal/key-person-valuation"),
    ]),
    f("The Method", [
      l("The Five Mechanisms", "/portal/mechanisms"),
      l("Sequence Planner", "/portal/sequence-planner"),
      l("Thresholds", "/portal/thresholds"),
      l("Integration Scorecard", "/portal/integration-scorecard"),
    ]),
  ]),

  // ══ 3. CLIENTS ═══════════════════════════════════════════════════════════
  f("Clients", [
    l("Client Directory", "/portal/clients"),
    l("Lead Inbox", "/portal/leads"),
    l("Planning Cases", "/portal/planning-cases"),
    l("Onboarding", "/portal/client-onboarding"),
    l("Smart Intake", "/portal/client-intake"),
    l("Meeting Notes", "/portal/ai-meeting-notes"),
    l("Snapshot Map", "/portal/client-snapshot"),
  ]),

  // ══ 4. NEW CLIENT WELCOME LIST ═══════════════════════════════════════════
  // Was 20 flat siblings, including the seven-part narrative arc which now
  // reads as the ordered sequence it is.
  f("New Client Welcome List", [
    f("Intake & Assessment", [
      l("Financial Assessment", "/portal/financial-assessment"),
      l("AI Financial Advisor", "/portal/ai-advisor"),
      l("My Secret Journey", "/portal/my-journey"),
      l("Plan Ledger", "/portal/plan-ledger"),
    ]),
    f("Forces & Controls", [
      l("Controls", "/portal/controls"),
      l("Purchasing Power", "/portal/erosion"),
      l("Outside Forces", "/portal/outside-forces"),
      l("Loan Forgiveness", "/portal/forgiveness"),
      l("Tax Schedule", "/portal/tax-schedule"),
      l("The Sphere", "/portal/sphere"),
    ]),
    f("Wealth Genome", [
      l("Wealth Genome Analysis", "/portal/wealth-genome"),
      l("What the Genome Says to Do", "/portal/genome-strategies"),
      l("Genome Pairing Protocol", "/portal/household-genome"),
    ]),
    f("The Seven", [
      l("1. The Arrival", "/portal/the-arrival"),
      l("2. The Mirror", "/portal/the-mirror"),
      l("3. Strategy Table", "/portal/the-strategy-table"),
      l("4. The Field", "/portal/the-field"),
      l("5. The Map", "/portal/the-map"),
      l("6. The Legacy", "/portal/the-legacy"),
      l("7. The Brotherhood", "/portal/the-brotherhood"),
    ]),
  ]),

  // ══ 5. PLANNING ══════════════════════════════════════════════════════════
  f("Planning", [
    f("Retirement & Income", [
      l("Retirement Drivers", "/portal/ecological-drivers"),
      l("Social Security", "/portal/social-security"),
      l("Income Gap Analyzer", "/portal/income-gap"),
      l("Withdrawal Sequencing", "/portal/withdrawal-sequencing"),
      l("Lifetime Income", "/portal/lifetime-income"),
      l("Income Timeline", "/portal/income-timeline"),
      l("Income Calculator", "/portal/advisor-income-calculator"),
    ]),
    f("Tax & Estate", [
      l("Tax Waterfall", "/portal/tax-waterfall"),
      l("Tax-Advantaged Growth", "/portal/tax-advantaged-growth"),
      l("Hot Income (Oil & Gas)", "/portal/hot-income"),
      l("Estate Tax", "/portal/estate-tax"),
      l("Estate Flow Chart", "/portal/estate-flow"),
      l("The Inheritance Engine", "/portal/inheritance"),
      l("Beneficiary Optimizer", "/portal/beneficiary-optimization"),
    ]),
    f("Strategy & Scenarios", [
      l("Strategy Lab", "/portal/strategy"),
      l("Roth Strategies (6)", "/portal/roth-conversion"),
      l("Strategy Compare", "/portal/strategy-compare"),
      l("Scenario Builder", "/portal/scenarios"),
      l("Side-by-Side Compare", "/portal/scenario-side-by-side"),
      l("5-Slot Comparison", "/portal/comparison"),
      l("IUL vs Roth", "/portal/iul-vs-roth"),
      l("Risk Tolerance", "/portal/risk-tolerance"),
      l("Market Stress Test", "/portal/market-stress-test"),
    ]),
  ]),

  // ══ 6. PRODUCTS ══════════════════════════════════════════════════════════
  f("Products", [
    f("IUL & Index", [
      l("Ibbotson Charts", "/portal/ibbotson-charts"),
      l("IUL Historical", "/portal/iul-historical"),
      l("The IUL Engine", "/portal/iul-engine"),
      l("Long-Term Care", "/portal/long-term-care"),
      l("Index Strategies", "/portal/index-strategies"),
      l("Policy Loans", "/portal/policy-loans"),
      l("Policy Cost Lab", "/portal/policy-cost-lab"),
      l("Premium Financing", "/portal/premium-financing"),
      l("Index Backtester", "/portal/index-backtester"),
      f("Time Machine", [
        l("Time Machine", "/portal/time-machine-calculator"),
        l("AG 49 Compounding", "/portal/time-machine-ag49"),
        l("Dual Illustration", "/portal/time-machine-method"),
      ]),
    ]),
    f("Annuities", [
      l("Growth Annuities", "/portal/growth-annuities"),
      l("MYGA Waterfall", "/portal/myga-fixed-rate"),
      l("Existing Annuities", "/portal/existing-annuities"),
      l("Income for Life", "/portal/income-for-life"),
      l("Top 10 Income", "/portal/income-annuity-top10"),
      l("Top 10 FIA", "/portal/fia-top10"),
      l("Accumulation DB", "/portal/annuity-accumulation-db"),
      l("Carrier Compare", "/portal/carrier-comparison"),
      l("Illustration Compare", "/portal/illustration-compare"),
      l("Policy Gap Analysis", "/portal/ai-policy-review"),
    ]),
    f("Real Estate", [
      l("Mortgage Killer", "/portal/mortgage-killer"),
      l("Household Wealth", "/portal/household-wealth"),
      l("Reverse HELOC", "/portal/reverse-heloc"),
    ]),
    f("Specialty", [l("Business Owner", "/portal/business-owner")]),
  ]),

  // ══ 7. AI & TOOLS ════════════════════════════════════════════════════════
  f("AI & Tools", [
    f("AI Assistants", [
      l("Strategy Assist", "/portal/ai-assist"),
      l("Strategy Recommender", "/portal/ai-recommender"),
      l("Ask Your Data", "/portal/data-query"),
      l("Predictive Analytics", "/portal/predictive-analytics"),
      l("Stale Digest", "/portal/stale-digest"),
    ]),
    f("Sales & Content", [
      l("Sales Story Builder", "/portal/sales-story"),
      l("Lead Generator", "/portal/lead-generator"),
      l("Competitive Analysis", "/portal/competitive"),
      l("Presentation Builder", "/portal/presentation-builder"),
      l("AI Slide Generator", "/portal/ai-slides"),
      l("My Slides Library", "/portal/my-slides"),
      l("Document Templates", "/portal/document-templates"),
      l("Video Proposals (AI)", "/portal/video-proposals"),
    ]),
  ]),

  // ══ 8. COMPLIANCE ════════════════════════════════════════════════════════
  f("Compliance", [
    l("Compliance Center", "/portal/compliance"),
    l("Compliance Monitor", "/portal/compliance-monitoring"),
    l("Alerts", "/portal/compliance-alerts"),
    l("Audit Trail", "/portal/compliance-audit-trail"),
  ]),

  // ══ 9. THE EXPERIENCE ════════════════════════════════════════════════════
  f("The Experience", [
    f("Command", [
      l("Daily Briefing", "/portal/daily-briefing"),
      l("Nerve Center", "/portal/nerve-center"),
      l("Quick Glance", "/portal/toilet"),
      l("Russell Number", "/portal/russell-number"),
      l("Daily Discovery", "/portal/daily-discovery"),
      l("My World", "/portal/my-world"),
      l("Avatar Twins", "/portal/avatar-twins"),
      l("Morning Ritual", "/portal/morning-ritual"),
      l("Wealth Feed", "/portal/infinite-scroll"),
    ]),
    f("Compete", [
      l("The Arena", "/portal/arena"),
      l("War Room", "/portal/war-room"),
      l("War Story Gen", "/portal/war-story-generator"),
      l("Time Machine", "/portal/time-machine"),
      l("Time-Lapse", "/portal/time-lapse"),
    ]),
    f("Earn", [
      l("Rewards Vault", "/portal/rewards"),
      l("Revenue Guarantee", "/portal/revenue-guarantee"),
      l("Pet Companion", "/portal/pet"),
    ]),
    f("Explore", [
      l("Black Mirror", "/portal/black-mirror"),
      l("Social Narcotic", "/portal/social"),
    ]),
    f("Transcend", [
      l("The Endgame", "/portal/endgame"),
      l("Will Writer", "/portal/will-writer"),
      l("Couples Mode", "/portal/couples"),
      l("Russell Wrapped", "/portal/wrapped"),
      l("Story Generator", "/portal/story-generator"),
      l("Live Co-Pilot", "/portal/co-pilot"),
    ]),
  ]),

  // ══ 10. TAX SECRETS ══════════════════════════════════════════════════════
  f("Tax Secrets", [
    l("100 Secret Strategies", "/portal/secret-secrets"),
    l("100 Tax-Free Combos", "/portal/tax-combos"),
    l("AI Combo Recommender", "/portal/combo-recommender"),
    l("Client Intake Form", "/portal/client-intake-recommender"),
    l("Divorce Devastation Engine", "/portal/divorce-calculator"),
    l("Trust Structures", "/portal/trusts"),
    l("Mortgage Killer V3", "/portal/mortgage-killer-v3"),
    l("Physician's Edge", "/portal/physicians-edge"),
  ]),

  // ══ 11. SECONDARY INFORMATION ════════════════════════════════════════════
  f("Secondary Information", [
    l("Secondary Library", "/portal/secondary-information"),
    // Was /portal/tool-explorer — no such route. Inert until retargeted.
    ph("Tool Explorer"),
    // Was /portal/knowledge-library — no such route; /portal/knowledge is the page.
    l("Knowledge Library", "/portal/knowledge"),
    l("Video Library", "/portal/video-library"),
    l("Patent Portfolio", "/portal/patent-showcase"),
  ]),

  // ══ 12. SETTINGS ═════════════════════════════════════════════════════════
  f("Settings", [
    l("Billing & Plans", "/portal/billing"),
    l("Platform Training", "/portal/agent-tutorial"),
    l("Connections", "/portal/connections"),
    l("Integrations", "/portal/integrations"),
    l("Bulk Generation", "/portal/bulk-generation"),
    l("Command Center", "/portal/command-center"),
    l("System Health", "/portal/system-health"),
    l("Site Health (SEO & Security)", "/portal/site-health"),
    l("Leaderboard", "/portal/leaderboard"),
  ]),
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Every routed path at or beneath `node`, in tree order. Placeholders omitted. */
export function collectPaths(node: NavNode): string[] {
  if (node.path) return [node.path];
  if (!node.children) return [];
  return node.children.flatMap(collectPaths);
}

/** Every routed path in the whole tree, in tree order. */
export function allNavPaths(nodes: NavNode[] = NAV_TREE): string[] {
  return nodes.flatMap(collectPaths);
}

/** path → node, for reverse lookup (favourites, breadcrumbs, active state). */
export function flattenNavTree(
  nodes: NavNode[] = NAV_TREE,
  map: Map<string, NavNode> = new Map(),
): Map<string, NavNode> {
  for (const node of nodes) {
    if (node.path) map.set(node.path, node);
    if (node.children) flattenNavTree(node.children, map);
  }
  return map;
}

/** Deepest folder nesting in the tree. A flat list of leaves is depth 1. */
export function maxDepth(nodes: NavNode[] = NAV_TREE): number {
  let deepest = 0;
  const walk = (ns: NavNode[], d: number) => {
    deepest = Math.max(deepest, d);
    for (const n of ns) if (n.children) walk(n.children, d + 1);
  };
  walk(nodes, 1);
  return deepest;
}

export type NavTreeProblems = {
  /** Paths with no matching route — these would 404. */
  unroutable: string[];
  /** Paths appearing at more than one place in the tree. */
  duplicates: string[];
  /** Nodes that are neither a folder, a leaf, nor a placeholder. */
  malformed: string[];
};

/**
 * Check the tree against the real route list.
 *
 * `routes` is `ROUTE_MANIFEST` from shared/routeManifest.ts. Kept as a
 * parameter rather than imported so this module stays free of server imports
 * and can be exercised directly from a test.
 */
export function validateNavTree(
  routes: readonly string[],
  nodes: NavNode[] = NAV_TREE,
): NavTreeProblems {
  const known = new Set(routes);
  const seen = new Map<string, number>();
  const malformed: string[] = [];

  const walk = (ns: NavNode[]) => {
    for (const n of ns) {
      const isFolder = Array.isArray(n.children);
      const isLeaf = typeof n.path === "string";
      if (isFolder && isLeaf) malformed.push(`${n.label}: both children and path`);
      else if (!isFolder && !isLeaf && !n.isPlaceholder) malformed.push(`${n.label}: neither`);
      if (isLeaf) seen.set(n.path!, (seen.get(n.path!) ?? 0) + 1);
      if (isFolder) walk(n.children!);
    }
  };
  walk(nodes);

  // Array.from rather than spread: the project's tsconfig target predates
  // ES2015 iterator downlevelling, so `[...map.keys()]` does not compile.
  return {
    unroutable: Array.from(seen.keys()).filter((p) => !known.has(p)).sort(),
    duplicates: Array.from(seen.entries())
      .filter(([, n]) => n > 1)
      .map(([p]) => p)
      .sort(),
    malformed: malformed.sort(),
  };
}
