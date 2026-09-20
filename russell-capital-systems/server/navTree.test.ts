/**
 * PR-2b — navigation tree structure + route-target validation.
 *
 * The route-target suite is the important one. The tree was ported from a
 * different application whose route set is roughly twice this one's, so the
 * failure mode being guarded against is a navigation entry pointing at a route
 * this application does not serve — a dead link in the menu that nothing else
 * would catch.
 */
import { describe, it, expect } from "vitest";
import { MEDICAL_TREE, collectPaths, flattenNavTree, type NavNode } from "@/navTree";
import { ROUTE_MANIFEST } from "@shared/routeManifest";

const MANIFEST = new Set<string>(ROUTE_MANIFEST);

function walk(nodes: NavNode[], visit: (n: NavNode, trail: string[]) => void, trail: string[] = []) {
  for (const n of nodes) {
    const here = [...trail, n.label];
    visit(n, here);
    if (n.children) walk(n.children, visit, here);
  }
}

function leaves(nodes: NavNode[]): { label: string; path: string; trail: string[] }[] {
  const out: { label: string; path: string; trail: string[] }[] = [];
  walk(nodes, (n, trail) => {
    if (n.path) out.push({ label: n.label, path: n.path, trail });
  });
  return out;
}

// ── route-target validation ────────────────────────────────────────────────
describe("navTree route targets", () => {
  it("every leaf points at a route in ROUTE_MANIFEST", () => {
    const orphans = leaves(MEDICAL_TREE).filter((l) => !MANIFEST.has(l.path));
    expect(
      orphans.map((o) => `${o.trail.join(" > ")} -> ${o.path}`),
      "navigation entries whose target is not a served route",
    ).toEqual([]);
  });

  it("declares no route that the manifest does not serve", () => {
    const declared = new Set(MEDICAL_TREE.flatMap(collectPaths));
    const unserved = [...declared].filter((p) => !MANIFEST.has(p));
    expect(unserved).toEqual([]);
  });

  it("introduces no duplicate navigation entry", () => {
    const all = leaves(MEDICAL_TREE).map((l) => l.path);
    const seen = new Map<string, number>();
    for (const p of all) seen.set(p, (seen.get(p) ?? 0) + 1);
    const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([p, n]) => `${p} x${n}`);
    expect(dupes, "the same route must not appear twice in the tree").toEqual([]);
  });

  it("covers a meaningful share of the manifest without claiming to cover it all", () => {
    const covered = new Set(MEDICAL_TREE.flatMap(collectPaths));
    // The tree is additive: it is not expected to reach every route. AppShell's
    // existing navigation remains the complete menu. This asserts the tree is
    // substantive, and documents that it is deliberately partial.
    expect(covered.size).toBeGreaterThanOrEqual(140);
    expect(covered.size).toBeLessThan(MANIFEST.size);
  });
});

// ── structure ──────────────────────────────────────────────────────────────
describe("navTree structure", () => {
  it("exposes the ten top-level sections", () => {
    expect(MEDICAL_TREE).toHaveLength(10);
    expect(MEDICAL_TREE.map((s) => s.label)).toEqual([
      "Health Check Reports",
      "Medicine",
      "Treatment Center",
      "Wellness Coaching",
      "Financial Diet",
      "Wealth Scanning",
      "Procedures Center",
      "Longevity Management",
      "Patients",
      "Wealth Genome",
    ]);
  });

  it("gives every node a non-empty label", () => {
    const unlabelled: string[] = [];
    walk(MEDICAL_TREE, (n, trail) => {
      if (!n.label || !n.label.trim()) unlabelled.push(trail.join(" > "));
    });
    expect(unlabelled).toEqual([]);
  });

  it("makes every node either a folder or a leaf, never both and never neither", () => {
    const bad: string[] = [];
    walk(MEDICAL_TREE, (n, trail) => {
      const isFolder = Array.isArray(n.children) && n.children.length > 0;
      const isLeaf = typeof n.path === "string" && n.path.length > 0;
      if (isFolder === isLeaf) bad.push(`${trail.join(" > ")} (folder=${isFolder}, leaf=${isLeaf})`);
    });
    expect(bad, "a node must be exactly one of folder or leaf").toEqual([]);
  });

  it("contains no empty folder", () => {
    const empty: string[] = [];
    walk(MEDICAL_TREE, (n, trail) => {
      if (n.children && n.children.length === 0) empty.push(trail.join(" > "));
    });
    expect(empty).toEqual([]);
  });

  it("starts every path with a slash", () => {
    const malformed = leaves(MEDICAL_TREE).filter((l) => !l.path.startsWith("/"));
    expect(malformed.map((m) => m.path)).toEqual([]);
  });
});

// ── helpers ────────────────────────────────────────────────────────────────
describe("navTree helpers", () => {
  it("collectPaths returns the single path of a leaf", () => {
    expect(collectPaths({ label: "x", path: "/portal" })).toEqual(["/portal"]);
  });

  it("collectPaths gathers descendants depth-first", () => {
    const node: NavNode = {
      label: "root",
      children: [
        { label: "a", path: "/a" },
        { label: "mid", children: [{ label: "b", path: "/b" }] },
      ],
    };
    expect(collectPaths(node)).toEqual(["/a", "/b"]);
  });

  it("collectPaths returns nothing for a childless folder", () => {
    expect(collectPaths({ label: "empty" })).toEqual([]);
  });

  it("flattenNavTree maps every leaf path to its node", () => {
    const map = flattenNavTree(MEDICAL_TREE);
    const all = leaves(MEDICAL_TREE);
    expect(map.size).toBe(new Set(all.map((l) => l.path)).size);
    for (const l of all) expect(map.get(l.path)?.label).toBeTruthy();
  });

  it("flattenNavTree round-trips against collectPaths", () => {
    const flat = [...flattenNavTree(MEDICAL_TREE).keys()].sort();
    const collected = [...new Set(MEDICAL_TREE.flatMap(collectPaths))].sort();
    expect(flat).toEqual(collected);
  });
});

// ── the additive guarantee ─────────────────────────────────────────────────
describe("navTree is additive", () => {
  it("does not add any route to the manifest", () => {
    // The tree only ever references routes; it must never be the reason a new
    // route appears. ROUTE_MANIFEST is the single source of truth for routing.
    const declared = new Set(MEDICAL_TREE.flatMap(collectPaths));
    const added = [...declared].filter((p) => !MANIFEST.has(p));
    expect(added, "navTree must not introduce routes").toEqual([]);
  });

  it("leaves the manifest size unchanged at 330", () => {
    expect(MANIFEST.size).toBe(330);
  });
});
