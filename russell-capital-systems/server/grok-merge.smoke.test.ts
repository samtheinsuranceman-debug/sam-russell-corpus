import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

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
    expect(currentRoutes.size).toBe(312); // 232 + the original platform routes + /for and /for/:slug + /portal/interior // master: +1 /portal/voice (Voice Studio), +1 /portal/whisperer, +3 role dashboards, +1 /portal/chain // branch: +39 calculators and tools restored in the catalogue pass (page files that existed on disk but were never routed), +1 /portal/qbi-optimizer, +2 /portal/mortgage-ledger and /portal/liquidity-routes // +1: /portal/how-a-figure-is-made, the provenance page // +2: /portal/alt-credit and /portal/alt-credit/:slug, the alternative-lines-of-credit tab // +1: /portal/genome-strategies, the genome strategy-fit formulary
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
    const shell = readFileSync(resolve("client/src/components/AppShell.tsx"), "utf8");
    expect(shell).toContain('label: "New Client Welcome List"');
    for (const route of addedRoutes) expect(shell).toContain(`path: "${route}"`);
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
