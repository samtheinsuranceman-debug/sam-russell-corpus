/**
 * Engine sources — every registered loader resolves to a real, non-empty
 * source list, and the normaliser handles every shape the engines export.
 */
import { describe, expect, it } from "vitest";
import {
  ENGINE_SOURCE_LOADERS,
  ENGINES_WITH_SOURCE_LOADERS,
  engineForPath,
  loadEngineSources,
  normalizeSources,
  uniqueSources,
} from "../shared/engineSources";
import { CALCULATORS } from "../shared/calculatorCatalog";
import { placeholderCohortSize } from "../shared/retirementDNA";
import { assumed, ruled, sourced } from "../shared/sourcing";

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

  it("prints Sourced records (shared/sourcing.ts): sources as sources, assumptions as assumptions, defects out loud", () => {
    expect(normalizeSources(sourced("S&P 500 price returns", "ChartRow, S&P 500 Returns by Year", "2026-09-14", { url: "https://chartrow.com/sp500/returns", n: 32 })))
      .toEqual([{ label: "S&P 500 price returns: ChartRow, S&P 500 Returns by Year", asOf: "2026-09-14", kind: "sourced", url: "https://chartrow.com/sp500/returns", note: "n = 32" }]);
    expect(normalizeSources(ruled(0.9, "26 U.S.C. § 7702", "2026-01-01"))).toEqual([{ label: "26 U.S.C. § 7702", asOf: "2026-01-01", kind: "rule" }]);
    expect(normalizeSources([assumed(80, "An 80th-percentile flag is our convention.")]))
      .toEqual([{ label: "We assumed: An 80th-percentile flag is our convention.", kind: "assumption" }]);
    const [bad] = normalizeSources(sourced("A rate", "internal", "2026-01-01"));
    expect(bad!.kind).toBe("sourced");
    expect(bad!.defect).toMatch(/names no document/);
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

  it("prints the look-back integrity engine's assumptions apart from its sources", async () => {
    const refs = (await loadEngineSources("shared/lookbackIntegrity.ts"))!;
    expect(refs.some(r => r.kind === "sourced" && /FLM-1491AO\.10/.test(r.label))).toBe(true);
    expect(refs.some(r => r.kind === "assumption" && r.label.startsWith("We assumed"))).toBe(true);
    expect(refs.every(r => !r.defect)).toBe(true);
    expect(engineForPath("/portal/lookback-integrity")).toBe("shared/lookbackIntegrity.ts");
  });

  it("returns null for an engine with no loader, so the footer can say so honestly", async () => {
    expect(await loadEngineSources("shared/doesNotExist.ts")).toBeNull();
  });

  it("names only engines the catalogue or memory bank could reach", () => {
    const catalogueEngines = new Set(CALCULATORS.map(c => c.engine).filter(Boolean));
    for (const engine of Object.keys(ENGINE_SOURCE_LOADERS)) {
      expect(/^shared\/.+\.ts$/.test(engine) || catalogueEngines.has(engine), engine).toBe(true);
    }
  });
});

describe("engineForPath", () => {
  it("maps a catalogue route to its engine and ignores a query string", () => {
    const withEngine = CALCULATORS.find(c => c.engine)!;
    expect(engineForPath(withEngine.path)).toBe(withEngine.engine);
    expect(engineForPath(`${withEngine.path}?tab=x`)).toBe(withEngine.engine);
    expect(engineForPath("/portal/not-a-real-page")).toBeNull();
    expect(engineForPath("/portal/outside-forces")).toBe("server/outsideForces.ts");
    expect(ENGINES_WITH_SOURCE_LOADERS).toContain(engineForPath("/portal/outside-forces"));
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
