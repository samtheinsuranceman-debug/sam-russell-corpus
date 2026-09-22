// ============================================================
// SITE MAP TREE — the whole site as one tree, derived, not hand-typed.
//   • Seven top-level tabs (the fewest that still say where things are).
//   • Every manifest route appears exactly once as a leaf, so the manifest
//     test keeps the map honest.
//   • Catalogued pages carry their title and one-line purpose from
//     calculatorCatalog.ts; uncatalogued routes get a title from their slug.
//   • `deeperLinks(path)` are the less-essential pages in the same category
//     that become "Go deeper" buttons at the top of a key page.
// Pure; used by the server (siteMap.tree) and the client (overlay, nav).
// ============================================================
import { ROUTE_MANIFEST } from "./routeManifest";
import { CALCULATORS, CATEGORY_LABELS, CATEGORY_ORDER, type CalculatorCategory, type CalculatorEntry } from "./calculatorCatalog";

export type TabId = "map" | "assess" | "plan" | "advisor" | "reports" | "practice" | "admin";

export interface SiteMapLeaf {
  path: string;
  title: string;
  purpose?: string;
  category?: CalculatorCategory;
  /** L1 = shown in the left nav; L2 = reachable as a deeper button or a hub tab; L3 = map only. */
  layer: "L1" | "L2" | "L3";
  featured?: boolean;
}

export interface SiteMapGroup {
  id: string;
  label: string;
  leaves: SiteMapLeaf[];
}

export interface SiteMapTab {
  id: TabId;
  label: string;
  groups: SiteMapGroup[];
}

export interface SiteMapTree {
  tabs: SiteMapTab[];
  /** Every leaf by path, for the overlay's colouring and the hive's titles. */
  byPath: Record<string, SiteMapLeaf>;
  routeCount: number;
}

const TAB_LABELS: Record<TabId, string> = {
  map: "Map",
  assess: "Assess",
  plan: "Plan",
  advisor: "Advisor",
  reports: "Reports",
  practice: "Practice",
  admin: "Admin",
};

/** Catalogue categories that live under the Plan tab, in catalogue order. */
const PLAN_CATEGORIES: CalculatorCategory[] = CATEGORY_ORDER.filter(c => c !== "diagnostics" && c !== "practice");

/** Route → tab, for routes the catalogue does not classify. Order matters: first match wins. */
const TAB_RULES: [RegExp, TabId, string][] = [
  [/^\/portal\/(map)$/, "map", "The map"],
  [/^\/portal\/(samuel-goldman|thomas-goldman|advisor|ask|ai-advisor|ai-brain-hub|whisper|librarian|the-arrival|the-mirror|the-field|the-map|the-strategy-table|the-legacy|the-brotherhood|tape-recorder|concierge)/, "advisor", "Samuel Goldman & the journey"],
  [/^\/portal\/(financial-assessment|fact-finder|household-genome|wealth-genome|genome|calibrat|diagnos|health|russell-number|financial-vitals|risk-score)/, "assess", "Assessment & genome"],
  [/^\/(fact-finder|calibrate)/, "assess", "Assessment & genome"],
  [/^\/portal\/(plan-ledger|ledger|report|slides|my-slides|pdf|advisory-summary|evidence|sources|data-sources|how-a-figure-is-made|provenance)/, "reports", "Ledger, reports & evidence"],
  [/^\/portal\/(leads|lead-inbox|clients?|pipeline|seminar|commission|referral|deal-room|meeting-prep|auto-closer|match-and-deploy|training|earn|compete|career|practice|crm|hubspot|email-campaign|team|onboarding)/, "practice", "Leads, clients & practice"],
  [/^\/portal\/(brain-hub|ai-connector|site-health|system-health|integration|scorecard|zip-engine|rental-status|admin|owner|settings|voice-studio|data-feeds|sweeps|patents?|patent-)/, "admin", "Owner, data & health"],
  [/^\/(administrator|executive|owner)/, "admin", "Owner, data & health"],
  [/^\/portal\//, "plan", "Other planning tools"],
];

function slugTitle(path: string): string {
  const slug = path.split("/").filter(s => s && !s.startsWith(":")).pop() ?? path;
  return slug.split("-").map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

function tabFor(path: string, entry?: CalculatorEntry): { tab: TabId; groupId: string; groupLabel: string } {
  if (entry) {
    if (entry.category === "diagnostics") return { tab: "assess", groupId: "diagnostics", groupLabel: CATEGORY_LABELS.diagnostics };
    if (entry.category === "practice") return { tab: "practice", groupId: "practice", groupLabel: CATEGORY_LABELS.practice };
    return { tab: "plan", groupId: entry.category, groupLabel: CATEGORY_LABELS[entry.category] };
  }
  for (const [re, tab, label] of TAB_RULES) if (re.test(path)) return { tab, groupId: `${tab}-other`, groupLabel: label };
  return { tab: "map", groupId: "public", groupLabel: "Public pages" };
}

/** Build the tree from the manifest and the catalogue. Deterministic. */
export function buildSiteMapTree(manifest: readonly string[] = ROUTE_MANIFEST, catalogue: readonly CalculatorEntry[] = CALCULATORS): SiteMapTree {
  const catalogueByPath = new Map(catalogue.map(c => [c.path, c] as const));
  const tabs = new Map<TabId, Map<string, SiteMapGroup>>();
  const byPath: Record<string, SiteMapLeaf> = {};

  for (const path of manifest) {
    if (path === "/404" || path.includes(":")) continue; // parametric and error routes are not destinations
    const entry = catalogueByPath.get(path);
    const { tab, groupId, groupLabel } = tabFor(path, entry);
    const leaf: SiteMapLeaf = {
      path,
      title: entry?.name ?? slugTitle(path),
      purpose: entry?.blurb,
      category: entry?.category,
      layer: entry ? (entry.featured ? "L1" : "L2") : "L3",
      featured: entry?.featured,
    };
    byPath[path] = leaf;
    const groups = tabs.get(tab) ?? new Map<string, SiteMapGroup>();
    const g = groups.get(groupId) ?? { id: groupId, label: groupLabel, leaves: [] };
    g.leaves.push(leaf);
    groups.set(groupId, g);
    tabs.set(tab, groups);
  }

  const order: TabId[] = ["map", "assess", "plan", "advisor", "reports", "practice", "admin"];
  const outTabs: SiteMapTab[] = order.map(id => {
    const groups = Array.from((tabs.get(id) ?? new Map<string, SiteMapGroup>()).values());
    // Plan groups in catalogue order, then anything else.
    groups.sort((a, b) => {
      const ia = PLAN_CATEGORIES.indexOf(a.id as CalculatorCategory);
      const ib = PLAN_CATEGORIES.indexOf(b.id as CalculatorCategory);
      if (ia !== ib) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.label.localeCompare(b.label);
    });
    for (const g of groups) g.leaves.sort((a, b) => (a.layer < b.layer ? -1 : a.layer > b.layer ? 1 : a.title.localeCompare(b.title)));
    return { id, label: TAB_LABELS[id], groups };
  });

  return { tabs: outTabs, byPath, routeCount: Object.keys(byPath).length };
}

let cached: SiteMapTree | null = null;
export function siteMapTree(): SiteMapTree {
  if (!cached) cached = buildSiteMapTree();
  return cached;
}

/** Titles by path, for the hive's working-memory summaries. */
export function siteMapTitles(tree: SiteMapTree = siteMapTree()): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [p, leaf] of Object.entries(tree.byPath)) out[p] = leaf.title;
  return out;
}

/**
 * The less-essential pages a visitor can go deeper into from `path`: same category
 * (or same group when uncatalogued), not the page itself, L2/L3 before L1, up to `limit`.
 */
export function deeperLinks(path: string, limit = 8, tree: SiteMapTree = siteMapTree()): SiteMapLeaf[] {
  const leaf = tree.byPath[path];
  if (!leaf) return [];
  const pool: SiteMapLeaf[] = [];
  for (const tab of tree.tabs) for (const g of tab.groups) {
    const same = leaf.category ? g.id === leaf.category : g.leaves.some(l => l.path === path);
    if (same) pool.push(...g.leaves);
  }
  const rank = { L2: 0, L3: 1, L1: 2 } as const;
  return pool
    .filter(l => l.path !== path)
    .sort((a, b) => rank[a.layer] - rank[b.layer] || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/** The seven-tab left navigation: L1 leaves as items, grouped, everything else reachable from the map or deeper buttons. */
export function leftNavFromTree(tree: SiteMapTree = siteMapTree()): SiteMapTab[] {
  return tree.tabs.map(t => ({
    ...t,
    groups: t.groups
      .map(g => ({ ...g, leaves: g.leaves.filter(l => l.layer === "L1" || t.id === "map" || t.id === "advisor") }))
      .filter(g => g.leaves.length > 0),
  }));
}
