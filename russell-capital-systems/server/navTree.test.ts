/**
 * Navigation tree tests — PR-2b.
 *
 * Two jobs:
 *   1. Structural invariants on the tree itself (no duplicates, no empty
 *      folders, every leaf well-formed).
 *   2. Route-target validation: every live navigation target must exist in
 *      shared/routeManifest.ts. This is the gate that makes the tree safe to
 *      extend — promoting a placeholder to a live link fails here unless the
 *      route actually exists.
 *
 * Lives in server/ because vitest.config.ts only collects server/**\/*.test.ts.
 * It imports the tree directly rather than parsing source, so it tests the
 * exported data, not a regex's view of it.
 */
import { describe, expect, it } from "vitest";
import { MEDICAL_TREE, collectPaths, flattenNavTree, type NavNode } from "../client/src/navTree";
import { ROUTE_MANIFEST } from "../shared/routeManifest";

/** Every node, depth-first, with its ancestor labels. */
function walk(nodes: NavNode[], trail: string[] = []): Array<{ node: NavNode; trail: string[] }> {
  const out: Array<{ node: NavNode; trail: string[] }> = [];
  for (const node of nodes) {
    const here = [...trail, node.label];
    out.push({ node, trail: here });
    if (node.children) out.push(...walk(node.children, here));
  }
  return out;
}

const ALL = walk(MEDICAL_TREE);
const FOLDERS = ALL.filter(e => e.node.children);
const LEAVES = ALL.filter(e => !e.node.children);
const LIVE = LEAVES.filter(e => e.node.path);
const PLACEHOLDERS = LEAVES.filter(e => e.node.isPlaceholder);
const MANIFEST = new Set<string>(ROUTE_MANIFEST);

describe("navTree — route-target validation", () => {
  it("every live navigation target exists in the route manifest", () => {
    const orphans = LIVE
      .filter(e => !MANIFEST.has(e.node.path!))
      .map(e => `${e.node.path}  (${e.trail.join(" › ")})`);
    // Named in the failure so a bad promotion says which entry and where.
    expect(orphans).toEqual([]);
  });

  it("no live target is a placeholder as well", () => {
    const both = LEAVES.filter(e => e.node.path && e.node.isPlaceholder).map(e => e.node.label);
    expect(both).toEqual([]);
  });

  it("every leaf is either a live link or a placeholder, never neither", () => {
    const neither = LEAVES
      .filter(e => !e.node.path && !e.node.isPlaceholder)
      .map(e => e.trail.join(" › "));
    expect(neither).toEqual([]);
  });

  it("placeholders carry no path", () => {
    const withPath = PLACEHOLDERS.filter(e => e.node.path).map(e => e.node.label);
    expect(withPath).toEqual([]);
  });

  it("targets are absolute paths", () => {
    const relative = LIVE.filter(e => !e.node.path!.startsWith("/")).map(e => e.node.path);
    expect(relative).toEqual([]);
  });
});

describe("navTree — no duplicate destinations", () => {
  it("registers each destination in exactly one place", () => {
    const byPath = new Map<string, string[]>();
    for (const e of LIVE) {
      const list = byPath.get(e.node.path!) ?? [];
      list.push(e.trail.join(" › "));
      byPath.set(e.node.path!, list);
    }
    const duplicated = [...byPath.entries()]
      .filter(([, trails]) => trails.length > 1)
      .map(([path, trails]) => `${path} appears at: ${trails.join(" | ")}`);
    // Mirrors the rule navigation-organization.test.ts enforces for the sidebar.
    expect(duplicated).toEqual([]);
  });

  it("collectPaths returns no duplicates for any subtree", () => {
    for (const { node, trail } of FOLDERS) {
      const paths = collectPaths(node);
      expect(new Set(paths).size, `duplicate within ${trail.join(" › ")}`).toBe(paths.length);
    }
  });
});

describe("navTree — structure", () => {
  it("has no empty folders", () => {
    const empty = FOLDERS.filter(e => e.node.children!.length === 0).map(e => e.trail.join(" › "));
    expect(empty).toEqual([]);
  });

  it("has no folder whose entire subtree is placeholders and nothing reachable", () => {
    // A top-level tab with zero live destinations would render as a dead branch.
    const deadTopLevel = MEDICAL_TREE
      .filter(n => n.children && collectPaths(n).length === 0)
      .map(n => n.label);
    expect(deadTopLevel).toEqual([]);
  });

  it("every node has a non-empty label", () => {
    const unlabelled = ALL.filter(e => !e.node.label || !e.node.label.trim()).length;
    expect(unlabelled).toBe(0);
  });

  it("sibling labels are unique within each folder", () => {
    for (const { node, trail } of FOLDERS) {
      const labels = node.children!.map(c => c.label);
      expect(new Set(labels).size, `duplicate sibling label under ${trail.join(" › ")}`).toBe(labels.length);
    }
  });

  it("nests no deeper than 6 levels", () => {
    const deepest = Math.max(...ALL.map(e => e.trail.length));
    expect(deepest).toBeLessThanOrEqual(6);
  });

  it("exposes a stable set of top-level tabs", () => {
    expect(MEDICAL_TREE.length).toBeGreaterThan(0);
    for (const tab of MEDICAL_TREE) expect(tab.children, `${tab.label} must be a folder`).toBeTruthy();
  });
});

describe("navTree — helpers", () => {
  it("collectPaths gathers only live paths from a subtree", () => {
    for (const tab of MEDICAL_TREE) {
      for (const p of collectPaths(tab)) {
        expect(typeof p).toBe("string");
        expect(MANIFEST.has(p), `${p} not in manifest`).toBe(true);
      }
    }
  });

  it("collectPaths over every tab equals the full live target set", () => {
    const viaHelper = new Set(MEDICAL_TREE.flatMap(t => collectPaths(t)));
    const viaWalk = new Set(LIVE.map(e => e.node.path!));
    expect([...viaHelper].sort()).toEqual([...viaWalk].sort());
  });

  it("flattenNavTree indexes every live leaf by its path", () => {
    const flat = flattenNavTree(MEDICAL_TREE);
    expect(flat).toBeInstanceOf(Map);
    // One entry per live target, keyed by path, valued by its node.
    expect(flat.size).toBe(new Set(LIVE.map(e => e.node.path!)).size);
    for (const [path, node] of flat) {
      expect(node.path).toBe(path);
      expect(MANIFEST.has(path), `${path} not in manifest`).toBe(true);
    }
  });

  it("flattenNavTree omits placeholders, which have no path to key on", () => {
    const flat = flattenNavTree(MEDICAL_TREE);
    const placeholderLabels = new Set(PLACEHOLDERS.map(e => e.node.label));
    const leaked = [...flat.values()].filter(n => n.isPlaceholder && placeholderLabels.has(n.label));
    expect(leaked).toEqual([]);
  });
});

describe("navTree — does not disturb the existing navigation", () => {
  it("is additive: the tree is not referenced by AppShell yet", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const shell = readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8");
    // PR-2b lands the tree and renderer without swapping out the live sidebar.
    // When a later PR mounts it, delete this test in that PR.
    expect(shell).not.toContain("navTree");
    expect(shell).not.toContain("NavTree");
  });

  it("covers a meaningful share of the manifest without claiming all of it", () => {
    const live = new Set(LIVE.map(e => e.node.path!));
    expect(live.size).toBeGreaterThan(100);
    expect(live.size).toBeLessThanOrEqual(MANIFEST.size);
  });
});
