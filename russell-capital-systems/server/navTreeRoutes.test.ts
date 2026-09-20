/**
 * ROUTE-TARGET VALIDATION FOR THE PORTED NAV TREE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The contract this file enforces: **nothing the sidebar renders may point at
 * a route this build does not serve.**
 *
 * `navTree.ts` is ported verbatim from a build with a larger route table, so
 * the raw tree genuinely contains targets that are dead here. That is expected
 * and is not the failure condition. The failure condition is a dead target
 * surviving into the *pruned* tree, which is the only thing the renderer is
 * allowed to draw.
 */

import { describe, it, expect } from "vitest";
import { MEDICAL_TREE } from "@shared/navTree";
import {
  collectNavTargets,
  pruneToRoutes,
  unmatchedTargets,
  duplicateTargets,
  emptyBranches,
} from "@shared/navTreeValidation";
import { ROUTE_MANIFEST } from "@shared/routeManifest";

const ROUTES = new Set(ROUTE_MANIFEST);
const PRUNED = pruneToRoutes(MEDICAL_TREE, ROUTES);

describe("nav tree → route manifest validation", () => {
  it("every target in the pruned tree exists in ROUTE_MANIFEST", () => {
    const orphans = collectNavTargets(PRUNED).filter((p) => !ROUTES.has(p));
    // Named, not counted — a failure should say which link is dead.
    expect(orphans).toEqual([]);
  });

  it("pruning leaves no branch without a reachable destination", () => {
    expect(emptyBranches(PRUNED)).toEqual([]);
  });

  it("no route is reachable from two different nav entries", () => {
    // Two menu entries onto one route is the duplication this consolidation
    // exists to remove, so it fails here rather than shipping.
    expect(duplicateTargets(PRUNED)).toEqual([]);
  });

  it("records the duplicate the source tree ships with", () => {
    // The source reaches /portal/mortgage-killer from both "Payoff Operations"
    // and "Payoff Coaching". Pruning keeps the first and drops the second, so
    // the rendered menu has one entry while the source stays diffable against
    // its origin. Pinned so a new duplicate cannot slip in unnoticed.
    expect(duplicateTargets(MEDICAL_TREE)).toEqual(["/portal/mortgage-killer"]);
  });

  it("pruning does not invent targets absent from the source tree", () => {
    const source = new Set(collectNavTargets(MEDICAL_TREE));
    const invented = collectNavTargets(PRUNED).filter((p) => !source.has(p));
    expect(invented).toEqual([]);
  });

  it("does not mutate the source tree", () => {
    const before = JSON.stringify(MEDICAL_TREE);
    pruneToRoutes(MEDICAL_TREE, ROUTES);
    expect(JSON.stringify(MEDICAL_TREE)).toBe(before);
  });

  it("keeps every source target this build can actually serve", () => {
    const servable = Array.from(new Set(collectNavTargets(MEDICAL_TREE)))
      .filter((p) => ROUTES.has(p))
      .sort();
    const kept = Array.from(new Set(collectNavTargets(PRUNED))).sort();
    // Pruning must drop dead links and nothing else.
    expect(kept).toEqual(servable);
  });
});

describe("coverage against this build's route table", () => {
  it("records how much of the tree this build can serve", () => {
    const targets = new Set(collectNavTargets(MEDICAL_TREE));
    const servable = Array.from(targets).filter((p) => ROUTES.has(p));
    const unmatched = unmatchedTargets(MEDICAL_TREE, ROUTES);

    expect(targets.size).toBe(servable.length + unmatched.length);

    // Pinned so the numbers cannot drift unnoticed. When routes are added to
    // this build, these assertions fail and are updated deliberately — which
    // is the point: the tree lights up on its own and the change is reviewed.
    expect(targets.size).toBe(271);
    expect(servable.length).toBe(147);
    expect(unmatched.length).toBe(124);
  });

  it("the unmatched targets are absent from ROUTE_MANIFEST, every one", () => {
    for (const path of unmatchedTargets(MEDICAL_TREE, ROUTES)) {
      expect(ROUTES.has(path)).toBe(false);
    }
  });

  it("adds no route to the application", () => {
    // This PR is additive to navigation only. The route table is untouched,
    // so the manifest must still be exactly the size it was.
    expect(ROUTE_MANIFEST.length).toBe(330);
  });
});
