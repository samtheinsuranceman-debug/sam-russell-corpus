import { describe, expect, it } from "vitest";
import {
  SITE_MAP_NUDGE_ON_OPEN,
  buildSiteMapTree,
  deeperLinks,
  findNode,
  leftNavFromTree,
  nudgeDue,
  siteMapTitles,
  walkNodes,
  type SiteMapNode,
} from "@shared/siteMapTree";
import { ROUTE_MANIFEST } from "@shared/routeManifest";
import { CALCULATORS } from "@shared/calculatorCatalog";
import { ADVISOR_NAME, SITE_MAP_NUDGE_TEXT } from "@shared/aiAdvisor";

describe("siteMapTree", () => {
  const tree = buildSiteMapTree();
  const destinations = ROUTE_MANIFEST.filter(p => p !== "/404" && !p.includes(":"));

  it("has exactly seven tabs in the fixed order", () => {
    expect(tree.tabs.map(t => t.id)).toEqual(["map", "assess", "plan", "advisor", "reports", "practice", "admin"]);
  });

  it("places every non-parametric manifest route exactly once (flat leaves)", () => {
    const seen = new Map<string, number>();
    for (const t of tree.tabs) for (const g of t.groups) for (const l of g.leaves) seen.set(l.path, (seen.get(l.path) ?? 0) + 1);
    expect(seen.size).toBe(new Set(destinations).size);
    expect(Array.from(seen.values()).every(n => n === 1)).toBe(true);
    expect(tree.routeCount).toBe(new Set(destinations).size);
  });

  it("places every manifest route exactly once in the nested tree, at some depth", () => {
    const seen = new Map<string, number>();
    let maxDepth = 0;
    for (const t of tree.tabs) for (const g of t.groups) walkNodes(g.nodes, n => {
      seen.set(n.path, (seen.get(n.path) ?? 0) + 1);
      if (n.depth > maxDepth) maxDepth = n.depth;
    });
    for (const p of destinations) expect(seen.get(p), `${p} missing from the tree`).toBe(1);
    expect(seen.size).toBe(new Set(destinations).size);
    expect(maxDepth).toBeGreaterThanOrEqual(1); // there are deeper pages under pages
  });

  it("no page is both a hub-level page and somebody's deeper child", () => {
    const roots = new Set<string>();
    const children = new Set<string>();
    for (const t of tree.tabs) for (const g of t.groups) {
      for (const n of g.nodes) roots.add(n.path);
      walkNodes(g.nodes, n => { for (const c of n.children) children.add(c.path); });
    }
    for (const p of roots) expect(children.has(p), `${p} is both a root and a child`).toBe(false);
    for (const p of children) expect(tree.parentOf[p]).toBeTruthy();
    for (const p of roots) expect(tree.parentOf[p]).toBeNull();
  });

  it("every child's depth is its parent's depth plus one, and no hub truncates its pages (no cap)", () => {
    for (const t of tree.tabs) for (const g of t.groups) {
      walkNodes(g.nodes, (n: SiteMapNode) => {
        for (const c of n.children) expect(c.depth).toBe(n.depth + 1);
      });
      let inTree = 0;
      walkNodes(g.nodes, () => { inTree++; });
      expect(inTree, `${t.id}/${g.id} nests every one of its pages`).toBe(g.leaves.length);
    }
    // The old overlay capped deeper links at 8 per page; the tree carries the whole hub.
    const plan = tree.tabs.find(t => t.id === "plan")!;
    const largestHub = Math.max(...plan.groups.map(g => g.leaves.length));
    expect(largestHub).toBeGreaterThan(8);
    let nested = 0;
    for (const g of plan.groups) walkNodes(g.nodes, () => { nested++; });
    expect(nested).toBe(plan.groups.reduce((n, g) => n + g.leaves.length, 0));
  });

  it("catalogued pages carry their catalogue title and purpose; uncatalogued ones get a slug title", () => {
    const first = CALCULATORS[0];
    expect(tree.byPath[first.path]?.title).toBe(first.name);
    expect(tree.byPath[first.path]?.purpose).toBe(first.blurb);
    const uncatalogued = ROUTE_MANIFEST.find(p => p.startsWith("/portal/") && !CALCULATORS.some(c => c.path === p) && !p.includes(":"));
    expect(uncatalogued).toBeTruthy();
    expect(tree.byPath[uncatalogued!]?.title.length).toBeGreaterThan(0);
    expect(tree.byPath[uncatalogued!]?.layer).toBe("L3");
  });

  it("the Plan tab groups follow the catalogue's category order", () => {
    const plan = tree.tabs.find(t => t.id === "plan")!;
    const ids = plan.groups.map(g => g.id);
    expect(ids.indexOf("retirement-income")).toBeLessThan(ids.indexOf("tax"));
    expect(ids.indexOf("tax")).toBeLessThan(ids.indexOf("insurance"));
  });

  it("deeper links are the page's deeper pages in the tree, nearest first, and stay in the hub", () => {
    const featured = CALCULATORS.find(c => c.featured && c.category !== "practice" && c.category !== "diagnostics")!;
    const node = findNode(featured.path, tree)!;
    expect(node).toBeTruthy();
    const links = deeperLinks(featured.path);
    expect(links.length).toBeGreaterThan(0);
    expect(links.some(l => l.path === featured.path)).toBe(false);
    expect(links.slice(0, node.children.length).map(l => l.path)).toEqual(node.children.map(c => c.path));
    expect(links.every(l => l.category === featured.category)).toBe(true);
    expect(deeperLinks(featured.path, 3).length).toBeLessThanOrEqual(3);
    expect(deeperLinks("/definitely/not/a/route")).toEqual([]);
  });

  it("a page at the bottom of its branch still has somewhere deeper to go (its siblings)", () => {
    let bottom: SiteMapNode | null = null;
    for (const t of tree.tabs) for (const g of t.groups) walkNodes(g.nodes, n => { if (!bottom && n.depth >= 1 && n.children.length === 0) bottom = n; });
    expect(bottom).toBeTruthy();
    const links = deeperLinks(bottom!.path);
    expect(links.some(l => l.path === bottom!.path)).toBe(false);
  });

  it("the left nav keeps only L1 leaves except on Map and Advisor, and never invents a route", () => {
    const nav = leftNavFromTree(tree);
    const manifest = new Set(ROUTE_MANIFEST);
    for (const t of nav) for (const g of t.groups) for (const l of g.leaves) {
      expect(manifest.has(l.path)).toBe(true);
      if (t.id !== "map" && t.id !== "advisor") expect(l.layer).toBe("L1");
    }
  });

  it("titles map covers every leaf", () => {
    const titles = siteMapTitles(tree);
    expect(Object.keys(titles).length).toBe(tree.routeCount);
  });

  it("is deterministic: building twice gives the same tree", () => {
    const again = buildSiteMapTree();
    expect(JSON.stringify(again.tabs)).toBe(JSON.stringify(tree.tabs));
  });
});

describe("the advisor's nudge", () => {
  it("fires on the third page open and never before", () => {
    expect(SITE_MAP_NUDGE_ON_OPEN).toBe(3);
    expect(nudgeDue(0, false)).toBe(false);
    expect(nudgeDue(1, false)).toBe(false);
    expect(nudgeDue(2, false)).toBe(false);
    expect(nudgeDue(3, false)).toBe(true);
  });

  it("fires once per session", () => {
    expect(nudgeDue(3, true)).toBe(false);
    expect(nudgeDue(4, true)).toBe(false);
    expect(nudgeDue(4, false)).toBe(true);
  });

  it("speaks the operator's words, with the advisor named from the one constant", () => {
    expect(SITE_MAP_NUDGE_TEXT).toContain("about 700 pages");
    expect(SITE_MAP_NUDGE_TEXT).toContain("What specifically are you looking for");
    expect(ADVISOR_NAME.length).toBeGreaterThan(0);
  });
});
