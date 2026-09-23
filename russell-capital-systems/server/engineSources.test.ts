/**
 * Engine sources — every registered loader resolves to a real, non-empty
 * source list, and the normaliser handles every shape the engines export.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ENGINE_SOURCE_LOADERS,
  ENGINES_WITH_SOURCE_LOADERS,
  ROUTE_ENGINES,
  engineForPath,
  enginesForPath,
  loadEngineSources,
  loadRouteSources,
  normalizeSources,
  routeHasShellSources,
  routeMatches,
  uniqueSources,
} from "../shared/engineSources";
import { PAGE_SOURCES } from "../shared/pageSources";
import { CALCULATORS } from "../shared/calculatorCatalog";
import { placeholderCohortSize } from "../shared/retirementDNA";

describe("normalizeSources", () => {
  it("accepts a string, a label/url object, a name/entity object, arrays and records", () => {
    expect(normalizeSources("U.S. Senate, Party Division")).toEqual([{ label: "U.S. Senate, Party Division" }]);
    expect(normalizeSources({ label: "IRS Rev. Proc. 2025-32", url: "https://www.irs.gov/x", asOf: "read 2026-09-17" }))
      .toEqual([{ label: "IRS Rev. Proc. 2025-32", url: "https://www.irs.gov/x", asOf: "read 2026-09-17" }]);
    expect(normalizeSources({ id: "fred-dgs10", name: "10-year Treasury", entity: "FRED", url: "https://fred.stlouisfed.org/series/DGS10" }))
      .toEqual([{ label: "10-year Treasury (FRED)", url: "https://fred.stlouisfed.org/series/DGS10" }]);
    expect(normalizeSources({ a: { label: "A", url: "https://a" }, b: { label: "B" } })).toEqual([{ label: "A", url: "https://a" }, { label: "B" }]);
    expect(normalizeSources([{ label: "A" }, "B"])).toEqual([{ label: "A" }, { label: "B" }]);
  });

  it("turns a scalar-only descriptor into one line and never throws on junk", () => {
    expect(normalizeSources({ basis: "calendar-year price return", verifiedOn: "2026-09-14", firstYear: 1994 })).toEqual([
      { label: "basis: calendar-year price return; verifiedOn: 2026-09-14; firstYear: 1994" },
    ]);
    expect(normalizeSources({ taxYear: 2026, thresholds: "IRS Rev. Proc. 2025-32 § 3.26", url: "https://www.irs.gov/x" })).toEqual([
      { label: "taxYear: 2026; thresholds: IRS Rev. Proc. 2025-32 § 3.26", url: "https://www.irs.gov/x" },
    ]);
    expect(normalizeSources(42)).toEqual([]);
    expect(normalizeSources(null)).toEqual([]);
    expect(normalizeSources({ label: "" })).toEqual([]);
  });

  it("de-duplicates by label", () => {
    expect(uniqueSources([{ label: "A", url: "https://a" }, { label: "A" }, { label: "B" }])).toHaveLength(2);
  });
});

describe("engine source loaders", () => {
  it("every registered loader resolves to a non-empty source list", async () => {
    for (const engine of ENGINES_WITH_SOURCE_LOADERS) {
      const sources = await loadEngineSources(engine);
      expect(sources, engine).not.toBeNull();
      expect(sources!.length, `${engine} exports an empty source list`).toBeGreaterThan(0);
      for (const s of sources!) expect(s.label.length, `${engine} has a source with no label`).toBeGreaterThan(3);
    }
  });

  it("returns null for an engine with no loader, so the footer can say so honestly", async () => {
    expect(await loadEngineSources("shared/doesNotExist.ts")).toBeNull();
  });

  it("names only engines the catalogue or memory bank could reach", () => {
    for (const engine of Object.keys(ENGINE_SOURCE_LOADERS)) expect(engine).toMatch(/^shared\/.+\.ts$/);
  });
});

describe("engineForPath", () => {
  it("maps a catalogue route to its engine and ignores a query string", () => {
    const withEngine = CALCULATORS.find(c => c.engine)!;
    expect(engineForPath(withEngine.path)).toBe(withEngine.engine);
    expect(engineForPath(`${withEngine.path}?tab=x`)).toBe(withEngine.engine);
    expect(engineForPath("/portal/not-a-real-page")).toBeNull();
  });
});

describe("routes mapped outside the catalogue", () => {
  const app = readFileSync(join(__dirname, "..", "client/src/App.tsx"), "utf8");
  const routerPaths = new Set(Array.from(app.matchAll(/<Route\s+path="([^"]+)"/g)).map(m => m[1]!));

  it("every ROUTE_ENGINES and PAGE_SOURCES key is a real route", () => {
    for (const route of [...Object.keys(ROUTE_ENGINES), ...Object.keys(PAGE_SOURCES)]) expect(routerPaths.has(route), route).toBe(true);
  });

  it("every engine a route names has a loader, so the footer never names an unsourced engine", () => {
    for (const [route, engines] of Object.entries(ROUTE_ENGINES)) {
      for (const e of engines) expect(ENGINE_SOURCE_LOADERS[e], `${route} → ${e}`).toBeDefined();
      expect(routeHasShellSources(route), route).toBe(true);
    }
  });

  it("every page source has a label, and a url or an explicit assumption", () => {
    for (const [route, refs] of Object.entries(PAGE_SOURCES)) {
      expect(refs.length, route).toBeGreaterThan(0);
      for (const r of refs) {
        expect(r.label.length, route).toBeGreaterThan(10);
        if (!r.url) expect(/^Assumption:|^Sample data:|^The /.test(r.label), `${route}: ${r.label.slice(0, 60)}`).toBe(true);
      }
    }
  });

  it("matches router patterns and prints engine sources before the page's own", async () => {
    expect(routeMatches("/portal/mechanism/:slug", "/portal/mechanism/velocity")).toBe(true);
    expect(routeMatches("/portal/mechanism/:slug", "/portal/mechanism")).toBe(false);
    expect(enginesForPath("/portal/mechanism/velocity?x=1")).toEqual(["shared/mechanismDossiers.ts", "shared/cycleEngine.ts"]);
    expect(engineForPath("/portal/medicare-irmaa")).toBe("shared/taxBracketEngine.ts");
    const r = await loadRouteSources("/portal/medicare-irmaa");
    expect(r.missing).toEqual([]);
    expect(r.sources.some(s => s.label.startsWith("IRS, Rev. Proc. 2025-32"))).toBe(true);
    expect(r.sources.some(s => s.url === "https://www.cms.gov/newsroom/fact-sheets/2025-medicare-parts-b-premiums-and-deductibles")).toBe(true);
    expect(routeHasShellSources("/portal/not-a-real-page")).toBe(false);
  });
});

describe("retirementDNA cohort placeholder (D47)", () => {
  it("is deterministic and inside the range the placeholder used", () => {
    expect(placeholderCohortSize("45-54|$1M-$3M")).toBe(placeholderCohortSize("45-54|$1M-$3M"));
    expect(placeholderCohortSize("45-54|$1M-$3M")).not.toBe(placeholderCohortSize("55-64|$1M-$3M"));
    for (const k of ["a", "b", "35-44|Under $250K", "65+|$3M+"]) {
      const n = placeholderCohortSize(k);
      expect(n).toBeGreaterThanOrEqual(200);
      expect(n).toBeLessThanOrEqual(700);
    }
  });
});
