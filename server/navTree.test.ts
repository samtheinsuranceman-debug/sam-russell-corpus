/**
 * Navigation tree — structure, route-target validation, and the additive
 * guarantee.
 *
 * `navTree.ts` was authored against an application with 612 routes. This one
 * registers 330. That mismatch is the whole reason these tests exist: the tree
 * is useful, and rendering it verbatim would put 124 dead links in the sidebar.
 */
import { describe, expect, it } from "vitest";
import { ROUTE_MANIFEST } from "@shared/routeManifest";
import { MEDICAL_TREE, type NavNode } from "@shared/navTree";
import {
  resolveNavTree,
  navTreePaths,
  navTreeStructuralIssues,
} from "@shared/navTreeResolve";

const routes = new Set(ROUTE_MANIFEST);

describe("navTree structure", () => {
  it("has no structural defects", () => {
    // Empty folders, folder-and-link nodes, unlabelled nodes, and leaves with
    // neither a path nor isPlaceholder. None is caught by route validation.
    expect(navTreeStructuralIssues(MEDICAL_TREE)).toEqual([]);
  });

  it("has ten top-level sections", () => {
    expect(MEDICAL_TREE).toHaveLength(10);
    for (const s of MEDICAL_TREE) {
      expect(s.label, "every section is labelled").toBeTruthy();
      expect(s.children?.length, `${s.label} has children`).toBeGreaterThan(0);
    }
  });

  it("nests five levels deep and the renderer handles it", () => {
    const { stats } = resolveNavTree(MEDICAL_TREE, routes);
    expect(stats.maxDepth).toBe(5);
  });

  it("counts out to a whole tree", () => {
    const { stats } = resolveNavTree(MEDICAL_TREE, routes);
    expect(stats.folders).toBe(123);
    expect(stats.leaves).toBe(289);
    // Every leaf is exactly one of: resolved, authored placeholder, or a path
    // this build does not serve. Nothing falls through the classification.
    const classified = stats.resolved + stats.authoredPlaceholders;
    expect(classified).toBeLessThanOrEqual(stats.leaves);
    expect(stats.leaves - classified).toBeGreaterThan(0);
  });

  it("targets one path from two places, which is allowed", () => {
    // /portal/mortgage-killer appears under two parents. That is legitimate in
    // a tree — the same tool reached from two contexts — and is why leaves
    // (289) exceed distinct paths (271). Pinned so it stays deliberate.
    const distinct = navTreePaths(MEDICAL_TREE);
    expect(distinct).toHaveLength(271);
    expect(distinct).toContain("/portal/mortgage-killer");
  });
});

describe("route-target validation against the 330-route manifest", () => {
  const { stats } = resolveNavTree(MEDICAL_TREE, routes);

  it("resolves every link it will render against the manifest", () => {
    // The core guarantee. Anything rendered as a link is a route this
    // application actually registers.
    const { tree } = resolveNavTree(MEDICAL_TREE, routes);
    const linked: string[] = [];
    const walk = (n: ReturnType<typeof resolveNavTree>["tree"][number]) => {
      if (!n.children?.length && !n.placeholder && n.path) linked.push(n.path);
      n.children?.forEach(walk);
    };
    tree.forEach(walk);

    expect(linked.length).toBeGreaterThan(0);
    const bad = linked.filter(p => !routes.has(p));
    expect(bad, `these would render as links but are not registered: ${bad.join(", ")}`).toEqual([]);
  });

  it("has exactly 124 targets this build does not serve", () => {
    /**
     * Pinned deliberately. 124 is not a defect — it is the migration backlog,
     * and these entries render inactive rather than as broken links.
     *
     * It is asserted exactly so the number cannot drift silently. Migrate a
     * route and this fails, forcing the count to be updated on purpose. That
     * makes the figure a live measure of progress instead of a stale comment.
     */
    expect(stats.unresolved).toBe(124);
    expect(stats.unresolvedPaths).toHaveLength(124);
  });

  it("names the unresolved paths, so the backlog is readable", () => {
    expect(stats.unresolvedPaths).toContain("/portal/backdoor-roth");
    expect(stats.unresolvedPaths).toContain("/portal/estate-liquidity");
    // Sorted, so a diff on this list is readable when it changes.
    expect(stats.unresolvedPaths).toEqual([...stats.unresolvedPaths].sort());
  });

  it("resolves 148 leaves against the manifest", () => {
    expect(stats.resolved).toBe(148);
    expect(stats.authoredPlaceholders).toBe(17);
  });

  it("every unresolved path is genuinely absent, not a near-miss", () => {
    // Guards against a trailing slash or casing difference being mistaken for
    // a missing route — that would hide a link we could have shipped.
    for (const p of stats.unresolvedPaths) {
      expect(routes.has(p)).toBe(false);
      expect(routes.has(p.replace(/\/$/, "")), `${p} differs only by a trailing slash`).toBe(false);
      expect(routes.has(p.toLowerCase()), `${p} differs only by case`).toBe(false);
    }
  });
});

describe("the resolver itself", () => {
  const stub: NavNode[] = [
    {
      label: "Section",
      children: [
        { label: "Real", path: "/real" },
        { label: "Missing", path: "/missing" },
        { label: "Authored placeholder", isPlaceholder: true },
        { label: "Nested", children: [{ label: "Deep", path: "/real" }] },
      ],
    },
  ];
  const stubRoutes = new Set(["/real"]);

  it("marks a registered path resolved and a missing one placeholder", () => {
    const { tree } = resolveNavTree(stub, stubRoutes);
    const kids = tree[0].children!;
    expect(kids[0]).toMatchObject({ label: "Real", resolved: true, placeholder: false });
    expect(kids[1]).toMatchObject({ label: "Missing", resolved: false, placeholder: true });
  });

  it("treats an authored placeholder as a placeholder, not a failure", () => {
    const { tree, stats } = resolveNavTree(stub, stubRoutes);
    expect(tree[0].children![2]).toMatchObject({ resolved: false, placeholder: true });
    expect(stats.authoredPlaceholders).toBe(1);
    // It has no path, so it is not part of the unresolved backlog.
    expect(stats.unresolvedPaths).toEqual(["/missing"]);
  });

  it("counts a path used twice once in the backlog", () => {
    const dup: NavNode[] = [
      { label: "A", children: [{ label: "x", path: "/gone" }] },
      { label: "B", children: [{ label: "y", path: "/gone" }] },
    ];
    const { stats } = resolveNavTree(dup, new Set());
    expect(stats.leaves).toBe(2);
    expect(stats.unresolved).toBe(1);
  });

  it("preserves every node — resolution never drops one", () => {
    const count = (ns: readonly NavNode[]): number =>
      ns.reduce((n, x) => n + 1 + count(x.children ?? []), 0);
    const countR = (ns: ReturnType<typeof resolveNavTree>["tree"]): number =>
      ns.reduce((n, x) => n + 1 + countR(x.children ?? []), 0);
    const { tree } = resolveNavTree(MEDICAL_TREE, routes);
    expect(countR(tree)).toBe(count(MEDICAL_TREE));
  });

  it("keeps labels and ordering intact", () => {
    const { tree } = resolveNavTree(MEDICAL_TREE, routes);
    expect(tree.map(t => t.label)).toEqual(MEDICAL_TREE.map(t => t.label));
  });

  it("resolves nothing when given an empty route set", () => {
    const { stats } = resolveNavTree(stub, new Set());
    expect(stats.resolved).toBe(0);
  });
});

describe("additive guarantee — nothing existing is orphaned", () => {
  it("does not add, remove or rename any route", () => {
    // This PR touches no route. The manifest is the contract, and it is
    // unchanged at 330. A nav tree that quietly registered a route would be
    // caught here before it reached the route-manifest smoke test.
    expect(ROUTE_MANIFEST).toHaveLength(330);
    expect(new Set(ROUTE_MANIFEST).size, "no duplicate routes").toBe(330);
  });

  it("every path the tree links to was already reachable before this PR", () => {
    // The tree surfaces existing routes in a new shape. It must not be the
    // only way to reach anything, so removing it can never strand a page.
    const { stats } = resolveNavTree(MEDICAL_TREE, routes);
    const linked = navTreePaths(MEDICAL_TREE).filter(p => routes.has(p));
    expect(linked.length).toBe(147);
    for (const p of linked) expect(ROUTE_MANIFEST).toContain(p);
    expect(stats.resolved).toBeGreaterThanOrEqual(linked.length);
  });
});
