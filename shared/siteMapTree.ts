// ============================================================
// SITE MAP TREE — the whole site as one tree, derived, not hand-typed.
//   • Seven top-level tabs (the fewest that still say where things are).
//   • Under each tab, hubs (the catalogue's categories, or a rule-derived
//     group); under each hub, pages; under each page, its deeper pages;
//     under those, their deeper pages. Any depth, no cap, collapsible.
//   • Every manifest route appears exactly once, at some depth, so the
//     manifest test keeps the map honest. No page is both a hub-level
//     page and somebody's deeper child.
//   • Catalogued pages carry their title and one-line purpose from
//     calculatorCatalog.ts; uncatalogued routes get a title from their slug.
//   • `deeperLinks(path)` are the pages nested under `path` in the tree —
//     the "Go deeper" buttons at the top of a page.
// Pure; used by the server (siteMap.tree) and the client (overlay, nav).
// ============================================================
import { ROUTE_MANIFEST } from "./routeManifest";
import { NUDGE_AFTER_PAGE_OPENS } from "./hiveMind";
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

/** A leaf with its deeper pages nested under it. Depth 0 = directly under the hub. */
export interface SiteMapNode extends SiteMapLeaf {
  depth: number;
  children: SiteMapNode[];
}

export interface SiteMapGroup {
  id: string;
  label: string;
  /** Every page in this hub, flat, sorted. Kept for the nav and the counts. */
  leaves: SiteMapLeaf[];
  /** The same pages as a tree: hub-level pages with their deeper pages nested. */
  nodes: SiteMapNode[];
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
  /** path → parent path, or null for a hub-level page. */
  parentOf: Record<string, string | null>;
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
  [/^\/portal\/(samuel-goldman|thomas-goldman|advisor|ask|ai-advisor|ai-brain-hub|whisper|librarian|the-arrival|the-mirror|the-field|the-map|the-strategy-table|the-legacy|the-brotherhood|tape-recorder|concierge)/, "advisor", "The advisor & the journey"],
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

// ── Nesting: which deeper page belongs under which page ───────────────
// Words shared between a page's title, slug and keywords decide the parent;
// ties go to the parent with the fewest children so the tree stays balanced.
// Generic words carry no signal and are ignored.
const STOP = new Set(["the", "a", "an", "and", "of", "vs", "v", "to", "in", "for", "your", "with", "on", "by", "or", "at",
  "calculator", "calc", "planner", "analyzer", "analyser", "engine", "strategy", "strategies", "tool", "tools", "hub",
  "advanced", "deep", "dive", "guide", "center", "centre", "dashboard", "portal", "page", "pages", "plan", "planning"]);

function tokens(leaf: SiteMapLeaf, keywords: readonly string[] | undefined): Set<string> {
  const out = new Set<string>();
  const add = (s: string) => {
    for (const w of s.toLowerCase().split(/[^a-z0-9]+/)) if (w.length > 2 && !STOP.has(w)) out.add(w);
  };
  add(leaf.title);
  add(leaf.path.split("/").filter(Boolean).pop() ?? "");
  for (const k of keywords ?? []) add(k);
  return out;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  a.forEach(w => { if (b.has(w)) n++; });
  return n;
}

/**
 * Attach each of `children` to the best of `parents`: most shared words, then
 * fewest children so far, then title order. Deterministic for a given input.
 */
function attach(parents: SiteMapNode[], children: SiteMapLeaf[], tok: (l: SiteMapLeaf) => Set<string>): SiteMapNode[] {
  const made: SiteMapNode[] = [];
  const sorted = [...children].sort((a, b) => a.title.localeCompare(b.title) || a.path.localeCompare(b.path));
  for (const c of sorted) {
    let best: SiteMapNode | null = null;
    let bestScore = -1;
    for (const p of parents) {
      const score = overlap(tok(c), tok(p));
      const better =
        best === null ||
        score > bestScore ||
        (score === bestScore && p.children.length < best.children.length) ||
        (score === bestScore && p.children.length === best.children.length && p.title.localeCompare(best.title) < 0);
      if (better) { best = p; bestScore = score; }
    }
    const node: SiteMapNode = { ...c, depth: (best?.depth ?? -1) + 1, children: [] };
    if (best) best.children.push(node);
    made.push(node);
  }
  return made;
}

/** The first word of a slug that carries meaning: "estate-planning-timeline" → "estate". */
function familyKey(leaf: SiteMapLeaf): string | null {
  const slug = leaf.path.split("/").filter(Boolean).pop() ?? "";
  for (const w of slug.toLowerCase().split(/[^a-z0-9]+/)) if (w.length > 2 && !STOP.has(w)) return w;
  return null;
}

/**
 * A hub whose pages all sit on one layer (nothing catalogued to hang them
 * from) is nested by family: pages whose slugs start with the same word
 * ("estate-…", "divorce-…", "1031-…") gather under the one with the shortest
 * title. Lone pages stay at the top. Deterministic.
 */
function nestByFamily(leaves: SiteMapLeaf[]): { roots: SiteMapNode[]; parentOf: Record<string, string | null> } {
  const roots: SiteMapNode[] = [];
  const parentOf: Record<string, string | null> = {};
  const families = new Map<string, SiteMapLeaf[]>();
  const loners: SiteMapLeaf[] = [];
  for (const l of leaves) {
    const k = familyKey(l);
    if (!k) { loners.push(l); continue; }
    const arr = families.get(k) ?? [];
    arr.push(l);
    families.set(k, arr);
  }
  const byTitle = (a: SiteMapLeaf, b: SiteMapLeaf) => a.title.localeCompare(b.title) || a.path.localeCompare(b.path);
  const keys = Array.from(families.keys()).sort();
  for (const k of keys) {
    const members = families.get(k)!;
    if (members.length === 1) { loners.push(members[0]); continue; }
    const head = [...members].sort((a, b) => a.title.length - b.title.length || byTitle(a, b))[0];
    const root: SiteMapNode = { ...head, depth: 0, children: [] };
    parentOf[head.path] = null;
    for (const m of members.filter(x => x.path !== head.path).sort(byTitle)) {
      root.children.push({ ...m, depth: 1, children: [] });
      parentOf[m.path] = head.path;
    }
    roots.push(root);
  }
  for (const l of loners) { roots.push({ ...l, depth: 0, children: [] }); parentOf[l.path] = null; }
  roots.sort((a, b) => byTitle(a, b));
  return { roots, parentOf };
}

/** Nest a hub's flat leaves: L1 pages on top, L2 under them, L3 under those. Layers that are empty are skipped. */
function nest(leaves: SiteMapLeaf[], keywordsByPath: Map<string, readonly string[] | undefined>): { roots: SiteMapNode[]; parentOf: Record<string, string | null> } {
  const tok = (l: SiteMapLeaf) => tokens(l, keywordsByPath.get(l.path));
  const byLayer = { L1: [] as SiteMapLeaf[], L2: [] as SiteMapLeaf[], L3: [] as SiteMapLeaf[] };
  for (const l of leaves) byLayer[l.layer].push(l);
  const layers = (["L1", "L2", "L3"] as const).map(k => byLayer[k]).filter(arr => arr.length > 0);

  const roots: SiteMapNode[] = [];
  const parentOf: Record<string, string | null> = {};
  if (layers.length === 0) return { roots, parentOf };
  if (layers.length === 1) return nestByFamily(leaves);

  // The top non-empty layer becomes the hub-level pages.
  for (const l of [...layers[0]].sort((a, b) => a.title.localeCompare(b.title) || a.path.localeCompare(b.path))) {
    roots.push({ ...l, depth: 0, children: [] });
    parentOf[l.path] = null;
  }
  let frontier: SiteMapNode[] = roots;
  for (let i = 1; i < layers.length; i++) {
    const placed = attach(frontier, layers[i], tok);
    for (const n of placed) {
      // find its parent among the frontier
      const parent = frontier.find(p => p.children.includes(n)) ?? null;
      parentOf[n.path] = parent ? parent.path : null;
      if (!parent) roots.push(n);
    }
    frontier = placed;
  }
  return { roots, parentOf };
}

/** Walk a node and its descendants, depth first. */
export function walkNodes(nodes: SiteMapNode[], visit: (n: SiteMapNode) => void): void {
  for (const n of nodes) { visit(n); walkNodes(n.children, visit); }
}

/** Build the tree from the manifest and the catalogue. Deterministic. */
export function buildSiteMapTree(manifest: readonly string[] = ROUTE_MANIFEST, catalogue: readonly CalculatorEntry[] = CALCULATORS): SiteMapTree {
  const catalogueByPath = new Map(catalogue.map(c => [c.path, c] as const));
  const keywordsByPath = new Map(catalogue.map(c => [c.path, c.keywords] as const));
  const tabs = new Map<TabId, Map<string, SiteMapGroup>>();
  const byPath: Record<string, SiteMapLeaf> = {};
  const parentOf: Record<string, string | null> = {};

  // Catalogued pages by hub, with their words, so an uncatalogued planning
  // route can be filed under the hub whose pages it shares words with.
  const hubWords = new Map<CalculatorCategory, Set<string>>();
  for (const c of catalogue) {
    if (c.category === "diagnostics" || c.category === "practice") continue;
    const words = hubWords.get(c.category) ?? new Set<string>();
    const leafLike: SiteMapLeaf = { path: c.path, title: c.name, layer: "L2" };
    tokens(leafLike, c.keywords).forEach(w => words.add(w));
    tokens({ path: "/", title: CATEGORY_LABELS[c.category], layer: "L3" }, undefined).forEach(w => words.add(w));
    hubWords.set(c.category, words);
  }
  const hubFor = (leaf: SiteMapLeaf): CalculatorCategory | null => {
    const mine = tokens(leaf, undefined);
    let best: CalculatorCategory | null = null;
    let bestScore = 0;
    for (const cat of PLAN_CATEGORIES) {
      const score = overlap(mine, hubWords.get(cat) ?? new Set());
      if (score > bestScore) { best = cat; bestScore = score; }
    }
    return best;
  };

  for (const path of manifest) {
    if (path === "/404" || path.includes(":")) continue; // parametric and error routes are not destinations
    if (byPath[path]) continue; // a route listed twice is still one page
    const entry = catalogueByPath.get(path);
    let { tab, groupId, groupLabel } = tabFor(path, entry);
    const leaf: SiteMapLeaf = {
      path,
      title: entry?.name ?? slugTitle(path),
      purpose: entry?.blurb,
      category: entry?.category,
      layer: entry ? (entry.featured ? "L1" : "L2") : "L3",
      featured: entry?.featured,
    };
    if (!entry && tab === "plan") {
      // An uncatalogued planning page nests under the hub it shares words with; otherwise it stays in "Other".
      const cat = hubFor(leaf);
      if (cat) { leaf.category = cat; groupId = cat; groupLabel = CATEGORY_LABELS[cat]; }
    }
    byPath[path] = leaf;
    const groups = tabs.get(tab) ?? new Map<string, SiteMapGroup>();
    const g = groups.get(groupId) ?? { id: groupId, label: groupLabel, leaves: [], nodes: [] };
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
    for (const g of groups) {
      g.leaves.sort((a, b) => (a.layer < b.layer ? -1 : a.layer > b.layer ? 1 : a.title.localeCompare(b.title)));
      const nested = nest(g.leaves, keywordsByPath);
      g.nodes = nested.roots;
      Object.assign(parentOf, nested.parentOf);
    }
    return { id, label: TAB_LABELS[id], groups };
  });

  return { tabs: outTabs, byPath, parentOf, routeCount: Object.keys(byPath).length };
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

/** Find a page's node anywhere in the tree. */
export function findNode(path: string, tree: SiteMapTree = siteMapTree()): SiteMapNode | null {
  let found: SiteMapNode | null = null;
  for (const tab of tree.tabs) for (const g of tab.groups) walkNodes(g.nodes, n => { if (!found && n.path === path) found = n; });
  return found;
}

/**
 * The pages a visitor can go deeper into from `path`: its deeper pages in the
 * tree, nearest first (children, then their children, and so on). A page at
 * the bottom of its branch offers its siblings instead, so every page has
 * somewhere deeper to go while the hub has more than one page. No cap unless
 * `limit` is given.
 */
export function deeperLinks(path: string, limit?: number, tree: SiteMapTree = siteMapTree()): SiteMapLeaf[] {
  const node = findNode(path, tree);
  if (!node) return [];
  const out: SiteMapLeaf[] = [];
  let level: SiteMapNode[] = node.children;
  while (level.length) {
    for (const n of level) out.push(stripNode(n));
    level = level.flatMap(n => n.children);
  }
  if (out.length === 0) {
    const parentPath = tree.parentOf[path];
    const siblings: SiteMapNode[] = parentPath
      ? (findNode(parentPath, tree)?.children ?? [])
      : groupOf(path, tree)?.nodes ?? [];
    for (const s of siblings) if (s.path !== path) out.push(stripNode(s));
  }
  return typeof limit === "number" ? out.slice(0, limit) : out;
}

function groupOf(path: string, tree: SiteMapTree): SiteMapGroup | null {
  for (const tab of tree.tabs) for (const g of tab.groups) if (g.leaves.some(l => l.path === path)) return g;
  return null;
}

function stripNode(n: SiteMapNode): SiteMapLeaf {
  const { path, title, purpose, category, layer, featured } = n;
  return { path, title, purpose, category, layer, featured };
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

// ── The advisor's nudge: when it is due ───────────────────────────────
/** The advisor speaks on the visitor's third page open from the map, never before. One definition: shared/hiveMind.ts. */
export const SITE_MAP_NUDGE_ON_OPEN: number = NUDGE_AFTER_PAGE_OPENS;

/**
 * True exactly once per session: on the open that reaches the threshold,
 * and never again after it has fired.
 */
export function nudgeDue(opensThisSession: number, firedThisSession: boolean): boolean {
  if (firedThisSession) return false;
  return opensThisSession >= SITE_MAP_NUDGE_ON_OPEN;
}
