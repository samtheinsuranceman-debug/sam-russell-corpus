/**
 * Page sources — every route in shared/pageSources.ts is a real route, every
 * engine it names has a source loader, every page-level source names a URL
 * and a date (or says in words that it is an assumption or unsourced), and
 * the footer's route matching handles `:param` segments.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROUTE_SOURCES } from "../shared/pageSources";
import {
  ENGINE_SOURCE_LOADERS,
  ROUTES_WITH_SHELL_SOURCES,
  engineForPath,
  routeSourcesKeyForPath,
  sourcePlanForPath,
} from "../shared/engineSources";

const appSrc = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf8");
const UNSOURCED_PREFIXES = ["Assumption:", "Not sourced", "Not corrected yet:", "Computed by ", "Sample data:", "The "];

describe("shared/pageSources.ts", () => {
  it("names only routes App.tsx declares", () => {
    for (const route of Object.keys(ROUTE_SOURCES)) {
      expect(appSrc.includes(`<Route path="${route}"`), `${route} is not a route in App.tsx`).toBe(true);
    }
  });

  it("names only engines with a source loader", () => {
    for (const [route, r] of Object.entries(ROUTE_SOURCES)) {
      for (const e of r.engines ?? []) expect(e in ENGINE_SOURCE_LOADERS, `${route}: ${e} has no loader`).toBe(true);
    }
  });

  it("gives every sourced figure a URL and a date, and says so in words when it has neither", () => {
    for (const [route, r] of Object.entries(ROUTE_SOURCES)) {
      expect((r.engines?.length ?? 0) + (r.sources?.length ?? 0), `${route} is empty`).toBeGreaterThan(0);
      for (const s of r.sources ?? []) {
        if (s.url) {
          expect(s.url, `${route}: ${s.label}`).toMatch(/^https:\/\//);
          expect(s.asOf, `${route}: ${s.label} has a URL but no date`).toBeTruthy();
        } else {
          expect(UNSOURCED_PREFIXES.some(p => s.label.startsWith(p)), `${route}: "${s.label.slice(0, 60)}" has no URL and does not say it is unsourced`).toBe(true);
        }
      }
      // A route may not rest on unsourced lines alone.
      const real = (r.engines?.length ?? 0) + (r.sources ?? []).filter(s => s.url).length;
      expect(real, `${route} has no real source`).toBeGreaterThan(0);
    }
  });

  it("puts every entry on the census's list of shell-sourced routes", () => {
    expect([...ROUTES_WITH_SHELL_SOURCES].sort()).toEqual(Object.keys(ROUTE_SOURCES).sort());
  });
});

describe("route matching for the footer", () => {
  it("matches a concrete path to its :param pattern and ignores query strings", () => {
    expect(routeSourcesKeyForPath("/portal/mechanism/iul")).toBe("/portal/mechanism/:slug");
    expect(routeSourcesKeyForPath("/portal/mechanism/iul/providers?x=1")).toBe("/portal/mechanism/:slug/providers");
    expect(routeSourcesKeyForPath("/portal/medicare-irmaa/")).toBe("/portal/medicare-irmaa");
    expect(routeSourcesKeyForPath("/portal/not-a-real-page")).toBeNull();
  });

  it("builds a plan from the page's engines and its own sources", () => {
    expect(engineForPath("/for")).toBe("shared/careerEngine.ts");
    const irmaa = sourcePlanForPath("/portal/medicare-irmaa")!;
    expect(irmaa.engines).toEqual(["shared/taxBracketEngine.ts", "shared/irmaa.ts"]);
    expect(irmaa.pageSources.some(s => s.url?.includes("cms.gov"))).toBe(true);
    const chain = sourcePlanForPath("/portal/chain")!;
    expect(chain.engines).toEqual(["shared/macroEngine.ts", "shared/ultraEngine.ts"]);
    expect(sourcePlanForPath("/portal/not-a-real-page")).toBeNull();
  });
});
