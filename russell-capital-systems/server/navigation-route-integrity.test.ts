// ─── Navigation → route integrity ───────────────────────────────────────────
//
// WHY THIS EXISTS. The suite already checks routes → navigation
// (`navigation-organization.test.ts` proves every static portal route is
// discoverable). Nothing checked the other direction, so a sidebar entry
// pointing at a route that does not exist was invisible to CI.
//
// Two of them survived that way: `/portal/tool-explorer` and
// `/portal/knowledge-library` are in the sidebar, are not in `App.tsx`, are
// not in `shared/routeManifest.ts`, and there is no redirect or alias
// mechanism. They 404. `navigation-organization.test.ts` currently asserts
// they must be present in the navigation, so the suite was enforcing two
// broken links.
//
// This test closes the direction that was missing. The two known-broken
// entries are listed as explicit, asserted exemptions rather than being
// quietly tolerated — the same pattern `navigation-organization.test.ts` uses
// for `NOT_IN_NAVIGATION`, and for the same reason: an exemption list is a
// liability if it is allowed to grow silently.
//
// Fixing the two is a separate, bounded change (see
// docs/consolidation/06-PHASED-PR-PLAN.md, PR-1). When they are fixed, delete
// them from KNOWN_BROKEN below and this test tightens automatically.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTE_MANIFEST } from "../shared/routeManifest";

/**
 * Navigation entries that point at no route, with the reason each is still
 * here. Every entry must still BE broken — an item that has since been fixed
 * has to leave this list, or the list becomes a stale excuse.
 */
const KNOWN_BROKEN: Record<string, string> = {
  "/portal/tool-explorer":
    "Pre-existing. In the sidebar and asserted by navigation-organization.test.ts, but never routed. The live tool explorer is /portal/explore. Scheduled for PR-1 of the consolidation plan.",
  "/portal/knowledge-library":
    "Pre-existing. Same shape as the entry above. The live knowledge library is /portal/knowledge. Scheduled for PR-1 of the consolidation plan.",
};

function routePatterns(appSource: string): Set<string> {
  return new Set(
    Array.from(appSource.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), (m) => m[1]),
  );
}

/** Wouter patterns: `/portal/clients/:id` should satisfy a nav link to itself. */
function isRouted(path: string, routes: Set<string>): boolean {
  if (routes.has(path)) return true;
  for (const pattern of routes) {
    if (!pattern.includes(":")) continue;
    const rx = new RegExp("^" + pattern.replace(/:[^/]+/g, "[^/]+") + "$");
    if (rx.test(path)) return true;
  }
  return false;
}

describe("navigation points only at routes that exist", () => {
  const appSource = readFileSync(resolve("client/src/App.tsx"), "utf8");
  const shellSource = readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8");
  const navSection = shellSource.slice(
    shellSource.indexOf("const NAV_SECTIONS"),
    shellSource.indexOf("const BOTTOM_TABS"),
  );
  const navPaths = Array.from(navSection.matchAll(/path:\s*["']([^"']+)["']/g), (m) => m[1]);
  const routes = routePatterns(appSource);

  it("has a sidebar to check", () => {
    expect(navPaths.length).toBeGreaterThan(100);
    expect(routes.size).toBeGreaterThan(300);
  });

  it("routes every sidebar link, except the ones we have written down", () => {
    const broken = navPaths.filter((p) => !isRouted(p, routes) && !(p in KNOWN_BROKEN));
    expect(broken, `sidebar links with no matching route in App.tsx: ${broken.join(", ")}`).toEqual([]);
  });

  it("keeps the broken-link exemptions honest: each must still be broken", () => {
    for (const [path, reason] of Object.entries(KNOWN_BROKEN)) {
      expect(reason.length, `${path} needs a real reason`).toBeGreaterThan(30);
      expect(
        isRouted(path, routes),
        `${path} is routed now — remove it from KNOWN_BROKEN`,
      ).toBe(false);
    }
  });

  it("lists every sidebar link in the route manifest, except the known-broken ones", () => {
    const manifest = new Set<string>(ROUTE_MANIFEST);
    const missing = navPaths.filter(
      (p) => !manifest.has(p) && !(p in KNOWN_BROKEN) && !isRouted(p, routes),
    );
    expect(missing, `sidebar links absent from routeManifest.ts: ${missing.join(", ")}`).toEqual([]);
  });

  it("points each sidebar link at exactly one destination", () => {
    expect(navPaths.length).toBe(new Set(navPaths).size);
  });
});
