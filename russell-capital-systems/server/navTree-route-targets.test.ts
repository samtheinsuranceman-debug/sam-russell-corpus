// ─── navTree route-target validation ────────────────────────────────────────
//
// The requirement this suite exists to satisfy: **every navigation target is
// validated against the 330-route manifest.**
//
// It asserts three separate things, because they fail for different reasons:
//
//   1. Nothing the resolver keeps as a link can be a non-route. This is the
//      invariant that makes a dead menu link impossible, and it must hold
//      absolutely — no exemptions, no allowlist.
//
//   2. The manifest agrees with the router. If `routeManifest.ts` drifts from
//      `App.tsx`, validating against the manifest would validate against a
//      fiction. The existing smoke tests check this too; it is re-checked here
//      because this suite's whole premise rests on it.
//
//   3. The unresolved count is pinned. 124 targets do not exist in this
//      application. That number should fall as pages arrive and must never
//      rise — a rise means someone added a target for a route that was never
//      created, which is the exact defect this port was designed not to
//      introduce.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTE_MANIFEST } from "../shared/routeManifest";
import { MEDICAL_TREE } from "../client/src/navTree";
import {
  isRoutable,
  resolveNavTree,
  allTargets,
  resolvedTargets,
  unresolvedTargets,
} from "../client/src/lib/navTreeResolver";

/**
 * Targets this application does not serve, as measured at port time.
 *
 * Not an allowlist for dead links — every one of these renders as a
 * placeholder and is not clickable. It is the migration backlog stated as a
 * number, and the ceiling below is what stops it growing.
 */
const UNRESOLVED_CEILING = 124;

function routerPaths(): Set<string> {
  const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
  return new Set(
    Array.from(app.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), (m) => m[1]),
  );
}

describe("navTree targets are validated against the route manifest", () => {
  it("validates against a manifest that matches the router in both directions", () => {
    const router = routerPaths();
    const manifest = new Set(ROUTE_MANIFEST);
    const inRouterOnly = [...router].filter((p) => !manifest.has(p));
    const inManifestOnly = [...manifest].filter((p) => !router.has(p));
    expect(inRouterOnly, `routed but absent from routeManifest.ts:\n${inRouterOnly.join("\n")}`).toEqual([]);
    expect(inManifestOnly, `in routeManifest.ts but not routed:\n${inManifestOnly.join("\n")}`).toEqual([]);
    expect(manifest.size).toBeGreaterThanOrEqual(330);
  });

  it("NEVER leaves a clickable target that is not a real route", () => {
    const dead: string[] = [];
    const walk = (nodes: readonly { path?: string; children?: any[] }[]) => {
      for (const n of nodes) {
        if (n.path && !isRoutable(n.path)) dead.push(n.path);
        if (n.children) walk(n.children);
      }
    };
    walk(resolveNavTree(MEDICAL_TREE));
    expect(dead, `clickable navigation targets with no route:\n${dead.join("\n")}`).toEqual([]);
  });

  it("classifies every declared target as exactly one of resolved or unresolved", () => {
    const distinct = new Set(allTargets(MEDICAL_TREE));
    const ok = resolvedTargets(MEDICAL_TREE);
    const bad = unresolvedTargets(MEDICAL_TREE);
    expect(ok.length + bad.length).toBe(distinct.size);
    expect(ok.filter((p) => bad.includes(p))).toEqual([]);
  });

  it("resolves every resolved target against the manifest, exactly", () => {
    for (const p of resolvedTargets(MEDICAL_TREE)) {
      expect(isRoutable(p), `${p} was classified resolved but is not routable`).toBe(true);
    }
  });

  it("keeps the unresolved count at or below its ceiling", () => {
    const bad = unresolvedTargets(MEDICAL_TREE);
    expect(
      bad.length,
      `Unresolved navigation targets rose to ${bad.length}, above the ceiling of ${UNRESOLVED_CEILING}.\n` +
        `A rise means a target was added for a route that does not exist. Add the route, or do not add the target.\n` +
        bad.join("\n"),
    ).toBeLessThanOrEqual(UNRESOLVED_CEILING);
  });

  it("keeps the ceiling honest: it must not sit far above the real count", () => {
    // A ceiling that drifts above reality stops being a guard. If routes have
    // arrived and the count has fallen, lower the ceiling in the same change.
    const actual = unresolvedTargets(MEDICAL_TREE).length;
    expect(
      UNRESOLVED_CEILING - actual,
      `The ceiling is ${UNRESOLVED_CEILING} but only ${actual} targets are unresolved. Lower it.`,
    ).toBeLessThanOrEqual(5);
  });

  it("resolves a meaningful share of the tree — this is not a no-op port", () => {
    const ok = resolvedTargets(MEDICAL_TREE);
    expect(ok.length).toBeGreaterThanOrEqual(140);
  });

  it("handles parameterised routes: a concrete path under /portal/clients/:id resolves", () => {
    const hasParamRoute = ROUTE_MANIFEST.some((p) => p.includes(":"));
    if (!hasParamRoute) return;
    const pattern = ROUTE_MANIFEST.find((p) => p.includes(":"))!;
    const concrete = pattern.replace(/:[^/]+/g, "sample");
    expect(isRoutable(concrete), `${concrete} should resolve via ${pattern}`).toBe(true);
  });

  it("rejects a path that is not in the manifest", () => {
    expect(isRoutable("/portal/definitely-not-a-real-route-xyz")).toBe(false);
  });
});
