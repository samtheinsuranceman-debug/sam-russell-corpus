// ─────────────────────────────────────────────────────────────────────────────
// Navigation tree tests (PR-2b).
//
// These live under server/ because `vitest.config.ts` includes only
// `server/**/*.test.ts`. The tree is React-free by design, so it tests fine in
// the node environment without touching the test structure or the config.
//
// The load-bearing test is `route targets` below: every non-placeholder leaf
// must point at a path the router actually serves. The tree was authored
// against a repository with 612 routes; this build has 330. Without this test
// that gap reopens silently the next time someone edits either file.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from "vitest";
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

function leaves(): Array<{ node: NavNode; trail: string[] }> {
  const out: Array<{ node: NavNode; trail: string[] }> = [];
  walk(MEDICAL_TREE, (node, trail) => {
    if (!node.children?.length) out.push({ node, trail });
  });
  return out;
}

describe("navTree — structure", () => {
  it("has ten top-level tabs", () => {
    expect(MEDICAL_TREE).toHaveLength(10);
  });

  it("gives every node a non-empty label", () => {
    walk(MEDICAL_TREE, (n) => {
      expect(typeof n.label).toBe("string");
      expect(n.label.trim().length).toBeGreaterThan(0);
    });
  });

  it("makes every node either a folder or a leaf, never both and never neither", () => {
    walk(MEDICAL_TREE, (n, trail) => {
      const isFolder = !!n.children?.length;
      const isLeaf = !!n.path || !!n.isPlaceholder;
      expect(isFolder !== isLeaf, `${trail.join(" › ")} is neither a folder nor a leaf, or is both`).toBe(true);
    });
  });

  it("never gives a node both a path and children", () => {
    walk(MEDICAL_TREE, (n, trail) => {
      if (n.children?.length) {
        expect(n.path, `${trail.join(" › ")} is a folder but also carries a path`).toBeUndefined();
      }
    });
  });

  it("has no empty folders", () => {
    walk(MEDICAL_TREE, (n, trail) => {
      if (n.children) {
        expect(n.children.length, `${trail.join(" › ")} is an empty folder`).toBeGreaterThan(0);
      }
    });
  });

  it("never marks a node as both a placeholder and a link", () => {
    walk(MEDICAL_TREE, (n, trail) => {
      if (n.isPlaceholder) {
        expect(n.path, `${trail.join(" › ")} is a placeholder but also has a path`).toBeUndefined();
      }
    });
  });

  it("cross-lists a path only deliberately, and under the same label", () => {
    // A nav tree may legitimately surface one tool from two categories — that
    // creates no duplicate ROUTE. What it must not do is drift: the same path
    // under two different labels is a copy-paste error, not a cross-listing.
    const byPath = new Map<string, Set<string>>();
    for (const { node } of leaves()) {
      if (!node.path) continue;
      if (!byPath.has(node.path)) byPath.set(node.path, new Set());
      byPath.get(node.path)!.add(node.label);
    }
    const inconsistent = [...byPath.entries()]
      .filter(([, labels]) => labels.size > 1)
      .map(([path, labels]) => `${path} appears as ${[...labels].join(" / ")}`);
    expect(inconsistent, inconsistent.join("\n")).toEqual([]);

    // Keep cross-listing rare and deliberate. Today: /portal/mortgage-killer.
    const paths = leaves().map((l) => l.node.path).filter(Boolean) as string[];
    const crossListed = new Set(paths.filter((p, i) => paths.indexOf(p) !== i));
    expect(crossListed.size, `cross-listed: ${[...crossListed].join(", ")}`).toBeLessThanOrEqual(1);
  });
});

describe("navTree — route targets", () => {
  it("points every link at a route in the manifest", () => {
    const broken = leaves()
      .filter(({ node }) => node.path && !MANIFEST.has(node.path))
      .map(({ node, trail }) => `${trail.join(" › ")} -> ${node.path}`);

    expect(
      broken,
      `${broken.length} nav link(s) target a path the router does not serve. ` +
        `Either add the route, or mark the leaf as a placeholder with ph("Label").\n` +
        broken.join("\n"),
    ).toEqual([]);
  });

  it("only uses absolute paths", () => {
    for (const { node, trail } of leaves()) {
      if (node.path) {
        expect(node.path.startsWith("/"), `${trail.join(" › ")} -> ${node.path} is not absolute`).toBe(true);
      }
    }
  });

  it("introduces no route that the manifest lacks", () => {
    // The tree is a view over the router. It must never be the only place a
    // path is declared, or the manifest stops being the single source of truth.
    const treePaths = new Set(MEDICAL_TREE.flatMap(collectPaths));
    const unknown = [...treePaths].filter((p) => !MANIFEST.has(p));
    expect(unknown, `paths known only to the tree: ${unknown.join(", ")}`).toEqual([]);
  });

  it("surfaces a meaningful share of the router", () => {
    // A guard against the tree quietly emptying out. It does not have to cover
    // every route — the existing NAV_SECTIONS sidebar remains the complete one.
    const covered = new Set(MEDICAL_TREE.flatMap(collectPaths));
    expect(covered.size).toBeGreaterThanOrEqual(100);
  });
});

describe("navTree — placeholders", () => {
  it("carries the placeholders left by the port", () => {
    const placeholders = leaves().filter(({ node }) => node.isPlaceholder);
    // 141 = 17 placeholders the donor tree already carried + 124 leaves
    // converted at port time, because this build has 330 routes and the donor
    // tree was written against 612. The number should fall as routes land,
    // never rise: a new nav entry should point at a real route.
    expect(placeholders.length).toBeGreaterThan(0);
    expect(placeholders.length).toBeLessThanOrEqual(141);
  });

  it("gives every placeholder a label and no path", () => {
    for (const { node, trail } of leaves()) {
      if (node.isPlaceholder) {
        expect(node.label.trim().length, `${trail.join(" › ")} placeholder has no label`).toBeGreaterThan(0);
        expect(node.path).toBeUndefined();
      }
    }
  });
});

describe("navTree — helpers", () => {
  it("collectPaths returns only leaf paths, and no placeholders", () => {
    const all = MEDICAL_TREE.flatMap(collectPaths);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((p) => typeof p === "string" && p.startsWith("/"))).toBe(true);
    const fromLeaves = leaves().map((l) => l.node.path).filter(Boolean);
    expect(new Set(all)).toEqual(new Set(fromLeaves as string[]));
  });

  it("collectPaths on a leaf returns just that leaf", () => {
    expect(collectPaths({ label: "x", path: "/portal" })).toEqual(["/portal"]);
    expect(collectPaths({ label: "x", isPlaceholder: true })).toEqual([]);
  });

  it("flattenNavTree maps every path back to its node", () => {
    const flat = flattenNavTree(MEDICAL_TREE);
    const paths = new Set(MEDICAL_TREE.flatMap(collectPaths));
    expect(flat.size).toBe(paths.size);
    for (const p of paths) {
      expect(flat.get(p)?.path).toBe(p);
    }
  });
});

describe("navTree — coexistence with the existing sidebar", () => {
  it("does not claim to replace NAV_SECTIONS", () => {
    // PR-2b is additive. The tree covers part of the router; the existing
    // sidebar covers paths the tree does not. If the tree ever grows to be a
    // superset, replacing NAV_SECTIONS becomes a separate, deliberate decision
    // — not something that happens by accident.
    const covered = new Set(MEDICAL_TREE.flatMap(collectPaths));
    expect(covered.size).toBeLessThan(MANIFEST.size);
  });
});
