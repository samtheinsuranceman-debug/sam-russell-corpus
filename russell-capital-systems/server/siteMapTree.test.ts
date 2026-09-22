import { describe, expect, it } from "vitest";
import { buildSiteMapTree, deeperLinks, leftNavFromTree, siteMapTitles } from "@shared/siteMapTree";
import { ROUTE_MANIFEST } from "@shared/routeManifest";
import { CALCULATORS } from "@shared/calculatorCatalog";

describe("siteMapTree", () => {
  const tree = buildSiteMapTree();

  it("has exactly seven tabs in the fixed order", () => {
    expect(tree.tabs.map(t => t.id)).toEqual(["map", "assess", "plan", "advisor", "reports", "practice", "admin"]);
  });

  it("places every non-parametric manifest route exactly once", () => {
    const expected = ROUTE_MANIFEST.filter(p => p !== "/404" && !p.includes(":"));
    const seen = new Map<string, number>();
    for (const t of tree.tabs) for (const g of t.groups) for (const l of g.leaves) seen.set(l.path, (seen.get(l.path) ?? 0) + 1);
    expect(seen.size).toBe(expected.length);
    expect(Array.from(seen.values()).every(n => n === 1)).toBe(true);
    expect(tree.routeCount).toBe(expected.length);
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

  it("deeper links exclude the page itself, prefer non-L1 pages, and stay in the category", () => {
    const featured = CALCULATORS.find(c => c.featured && c.category !== "practice" && c.category !== "diagnostics")!;
    const links = deeperLinks(featured.path, 5);
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(5);
    expect(links.some(l => l.path === featured.path)).toBe(false);
    expect(links.every(l => l.category === featured.category)).toBe(true);
    expect(deeperLinks("/definitely/not/a/route")).toEqual([]);
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
});
