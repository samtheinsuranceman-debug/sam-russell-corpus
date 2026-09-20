/**
 * Navigation tree invariants.
 *
 * The tree was imported from another application with a different route
 * surface, so the things that could go wrong on import are exactly the things
 * asserted here: a link to a route that does not exist, a destination that
 * silently stopped being reachable, and the same page reachable from two
 * places in the menu.
 *
 * These run against shared/routeManifest.ts, the same list the route smoke
 * tests use, so navigation and routing cannot drift apart without one of them
 * failing.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  MEDICAL_TREE,
  collectPaths,
  flattenNavTree,
  treeDepth,
  type NavNode,
} from "../client/src/navTree";
import { ROUTE_MANIFEST } from "../shared/routeManifest";

const manifest = new Set(ROUTE_MANIFEST);
const paths = collectPaths();

/** The nav entries the previous three-level AppShell structure carried. */
function previousNavPaths(): string[] {
  const src = readFileSync(`${process.cwd()}/client/src/components/AppShell.tsx`, "utf8");
  const start = src.indexOf("const NAV_SECTIONS");
  if (start === -1) return [];
  const end = src.indexOf("\n];", start);
  return [...src.slice(start, end).matchAll(/path: "([^"]+)"/g)].map(m => m[1]);
}

describe("navTree — route validation", () => {
  it("every navigable destination is a registered route", () => {
    const unresolved = paths.filter(p => !manifest.has(p));
    expect(unresolved, "nav entries pointing at routes that do not exist").toEqual([]);
  });

  it("registers no path more than once", () => {
    const counts = new Map<string, number>();
    for (const p of paths) counts.set(p, (counts.get(p) ?? 0) + 1);
    const dupes = [...counts.entries()].filter(([, n]) => n > 1).map(([p]) => p);
    expect(dupes, "the same page reachable from two places in the menu").toEqual([]);
  });

  it("orphans nothing that the previous navigation could reach", () => {
    const before = previousNavPaths().filter(p => manifest.has(p));
    const now = new Set(paths);
    const lost = [...new Set(before)].filter(p => !now.has(p));
    expect(lost, "destinations that were reachable before and are not now").toEqual([]);
  });
});

describe("navTree — shape", () => {
  it("nests deeper than the three levels it replaces", () => {
    expect(treeDepth()).toBeGreaterThan(3);
  });

  it("every node is a folder, a link, or a placeholder — never nothing", () => {
    const broken = flattenNavTree()
      .filter(({ node }) => !node.children?.length && !node.path && !node.isPlaceholder)
      .map(({ node, trail }) => [...trail, node.label].join(" › "));
    expect(broken, "nodes with no children, no path and no placeholder flag").toEqual([]);
  });

  it("no node is both a folder and a link", () => {
    const both = flattenNavTree()
      .filter(({ node }) => node.children?.length && node.path)
      .map(({ node }) => node.label);
    expect(both).toEqual([]);
  });

  it("every node is labelled", () => {
    const unlabelled = flattenNavTree().filter(({ node }) => !node.label?.trim());
    expect(unlabelled).toEqual([]);
  });

  it("a placeholder never carries a path", () => {
    const contradictory = flattenNavTree()
      .filter(({ node }) => node.isPlaceholder && node.path)
      .map(({ node }) => node.label);
    expect(contradictory).toEqual([]);
  });
});

describe("navTree — helpers", () => {
  it("collectPaths walks the whole tree, not just the top", () => {
    expect(paths.length).toBeGreaterThan(MEDICAL_TREE.length);
  });

  it("collectPaths returns only real destinations", () => {
    expect(paths.every(p => typeof p === "string" && p.startsWith("/"))).toBe(true);
  });

  it("flattenNavTree records the ancestor trail", () => {
    const deep = flattenNavTree().find(({ trail }) => trail.length >= 3);
    expect(deep, "expected at least one node three levels down").toBeDefined();
    expect(deep!.trail.every(t => typeof t === "string" && t.length > 0)).toBe(true);
  });

  it("flattenNavTree visits every node exactly once", () => {
    const count = (ns: readonly NavNode[]): number =>
      ns.reduce((n, x) => n + 1 + (x.children ? count(x.children) : 0), 0);
    expect(flattenNavTree().length).toBe(count(MEDICAL_TREE));
  });

  it("treeDepth of an empty tree is zero", () => {
    expect(treeDepth([])).toBe(0);
  });
});
