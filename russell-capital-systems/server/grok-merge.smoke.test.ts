import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTE_COUNT, diffRoutes } from "../shared/routeManifest";

const addedRoutes = [
  "/portal/the-arrival",
  "/portal/the-mirror",
  "/portal/the-strategy-table",
  "/portal/the-field",
  "/portal/the-map",
  "/portal/the-legacy",
  "/portal/the-brotherhood",
];

const unifiedPlatformRoutes = [
  "/portal/secondary-information",
  "/portal/planning-cases",
  "/portal/system-health",
];

const deltaFiles = [
  "client/src/pages/portal/TheArrival.tsx",
  "client/src/pages/portal/TheMirror.tsx",
  "client/src/pages/portal/TheStrategyTable.tsx",
  "client/src/pages/portal/TheField.tsx",
  "client/src/pages/portal/TheMap.tsx",
  "client/src/pages/portal/TheLegacy.tsx",
  "client/src/pages/portal/TheBrotherhood.tsx",
  "client/src/pages/portal/_genome/GenomeKit.tsx",
];

function routeSet(source: string) {
  return new Set(Array.from(source.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), match => match[1]));
}

describe("verified Grok delta merge", () => {
  const currentApp = readFileSync(resolve("client/src/App.tsx"), "utf8");
  const currentRoutes = routeSet(currentApp);

  it("retains every Grok and unified-platform route in the 239-route application", () => {
    // The manifest replaces a hard-coded count: it merges cleanly between
    // parallel branches and names the exact paths that differ, in both
    // directions, instead of reporting a number that moved.
    const d = diffRoutes(Array.from(currentRoutes).map(String));
    expect(d.missing, "declared in the manifest but not registered").toEqual([]);
    expect(d.unexpected, "registered but missing from shared/routeManifest.ts").toEqual([]);
    expect(d.duplicates, "the same path registered more than once").toEqual([]);
    expect(currentRoutes.size).toBe(ROUTE_COUNT);
    for (const route of [...addedRoutes, ...unifiedPlatformRoutes]) {
      expect(currentRoutes.has(route), route).toBe(true);
    }
  });

  it("retains all eight imported delta modules as nontrivial source files", () => {
    for (const relativePath of deltaFiles) {
      expect(existsSync(resolve(relativePath)), relativePath).toBe(true);
      expect(readFileSync(resolve(relativePath), "utf8").length, relativePath).toBeGreaterThan(500);
    }
  });

  it("makes every Grok route discoverable in the active left navigation", () => {
    // Was asserted via the section name "New Client Welcome List". That section
    // was retired in the 2026-09-19 nav rebuild because twenty items is not a
    // welcome list. Discoverability is what the test was ever about, so it is
    // now asserted directly, against the path.
    const shell = readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8");
    for (const route of addedRoutes) expect(shell, route).toContain(`path: "${route}"`);
  });

  it("loads every added page module without a missing runtime import", async () => {
    const modules = await Promise.all([
      import("../client/src/pages/portal/TheArrival"),
      import("../client/src/pages/portal/TheMirror"),
      import("../client/src/pages/portal/TheStrategyTable"),
      import("../client/src/pages/portal/TheField"),
      import("../client/src/pages/portal/TheMap"),
      import("../client/src/pages/portal/TheLegacy"),
      import("../client/src/pages/portal/TheBrotherhood"),
    ]);
    for (const module of modules) expect(module.default).toBeTypeOf("function");
  });
});
